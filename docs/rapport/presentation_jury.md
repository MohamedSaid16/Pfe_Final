# Texte de Présentation — Soutenance PFE
## Module : Authentification et Gestion des Rôles

**Étudiant :** Ghoulam Mohamed Said
**Équipe :** Reddas Belkacem · Chelig Mohamed Amine
**Encadreur :** Dr. Abdelkader Bougassa
**Université Ibn Khaldoun — Tiaret — 2024/2025**

---

## OUVERTURE (30 secondes)

> Bonjour Madame, Messieurs les membres du jury.
>
> Je m'appelle **Ghoulam Mohamed Said**, et je vais vous présenter ma contribution au projet de fin d'études intitulé **« Système de Gestion Universitaire Intégré »**, développé en collaboration avec mes camarades **Reddas Belkacem** et **Chelig Mohamed Amine**, sous la direction de notre encadreur **Monsieur Abdelkader Bougassa**.
>
> Ma partie porte spécifiquement sur le module **Authentification et Gestion des Rôles**, qui constitue le cœur sécuritaire de toute l'application.

---

## 1. CONTEXTE ET PROBLÉMATIQUE (1 minute)

> Notre université, comme beaucoup d'établissements algériens, gère encore la plupart de ses processus administratifs sur papier ou via des outils dispersés. Notre équipe a donc décidé de concevoir une plateforme unifiée qui regroupe la gestion des PFE, des réclamations, des annonces, et des justifications d'absence.
>
> Mais avant même de penser à ces fonctionnalités, il fallait répondre à une question fondamentale :
>
> **« Comment garantir que chaque utilisateur accède uniquement à ce qu'il a le droit de voir et de faire ? »**
>
> Notre plateforme regroupe trois profils très différents :
> - L'**administrateur**, qui gère tout le système.
> - L'**enseignant**, qui propose des sujets PFE et participe aux jurys.
> - L'**étudiant**, qui consulte les annonces et soumet ses demandes.
>
> Si un étudiant pouvait accéder à l'interface administrateur, ou si un enseignant pouvait modifier des notes qui ne sont pas les siennes, toute la confiance dans le système s'effondrerait.
>
> C'est pourquoi mon travail s'est concentré sur la mise en place d'un **système d'authentification sécurisé** et d'un **contrôle d'accès strict basé sur les rôles**.

---

## 2. LES OBJECTIFS DE MON MODULE (45 secondes)

> Concrètement, mon module devait répondre à quatre objectifs principaux :
>
> 1. **Authentifier** chaque utilisateur de manière fiable, avec un identifiant et un mot de passe.
> 2. **Émettre un jeton sécurisé** après chaque connexion, qui prouve l'identité de l'utilisateur dans toutes ses requêtes suivantes.
> 3. **Vérifier les permissions** sur chaque action, pour s'assurer que personne n'accède à une ressource interdite.
> 4. **Protéger l'application** contre les attaques classiques du web : vol de mot de passe, falsification d'identité, élévation de privilèges.

---

## 3. LES TECHNOLOGIES CHOISIES (1 minute)

> Pour répondre à ces objectifs, j'ai utilisé une stack technique moderne et éprouvée :
>
> Côté **backend**, j'ai développé en **Node.js avec TypeScript**, en utilisant le framework **Express.js** pour exposer une API REST. La base de données est **PostgreSQL**, et j'ai utilisé l'ORM **Prisma** pour interagir avec elle de manière sécurisée.
>
> Côté **frontend**, l'interface est développée en **React.js** avec **Tailwind CSS** pour le design.
>
> Pour la sécurité, j'ai fait deux choix importants :
>
> - **JSON Web Token (JWT)** pour gérer les sessions, parce qu'il permet une architecture sans état, donc facilement scalable.
> - **bcrypt** avec un facteur de coût de 12 pour hacher les mots de passe, ce qui rend les attaques par force brute pratiquement impossibles.

---

## 4. LE FONCTIONNEMENT — LE FLUX D'AUTHENTIFICATION (2 minutes)

> Permettez-moi de vous expliquer comment se déroule une connexion, étape par étape.
>
> **Étape 1 :** L'utilisateur saisit son email et son mot de passe sur la page de connexion.
>
> **Étape 2 :** Le frontend envoie ces informations au serveur via une requête POST sécurisée.
>
> **Étape 3 :** Le serveur recherche l'utilisateur dans la base de données via Prisma. Si l'email n'existe pas, il retourne une erreur générique — *« identifiants invalides »* — sans préciser si c'est l'email ou le mot de passe qui est faux. C'est volontaire : cela empêche un attaquant de deviner quels comptes existent.
>
> **Étape 4 :** Si l'email existe, le serveur compare le mot de passe saisi avec le hash stocké, en utilisant bcrypt. Cette comparaison prend environ 250 millisecondes — c'est lent volontairement, pour ralentir les attaques par force brute.
>
> **Étape 5 :** Si tout est valide, le serveur génère un token JWT contenant l'identifiant et le rôle de l'utilisateur, signé avec une clé secrète, et valable 24 heures.
>
> **Étape 6 :** Ce token est renvoyé au frontend, qui le stocke dans le localStorage du navigateur.
>
> **Étape 7 :** À partir de ce moment, **chaque requête** envoyée par l'utilisateur inclut automatiquement ce token dans son en-tête `Authorization`. C'est un intercepteur Axios que j'ai configuré qui s'occupe de l'injecter automatiquement, sans que je doive le faire manuellement à chaque appel.

---

## 5. LE CONTRÔLE D'ACCÈS PAR RÔLE (RBAC) (1 minute 30)

> Une fois l'utilisateur authentifié, il faut vérifier qu'il a bien le droit d'accéder à la ressource demandée. C'est le rôle du système **RBAC**, *Role-Based Access Control*.
>
> J'ai implémenté ce contrôle à travers **deux middlewares** que je chaîne sur chaque route protégée :
>
> Le premier, **`requireAuth`**, vérifie la présence et la validité du token JWT. Si le token est absent, expiré, ou falsifié, la requête est immédiatement rejetée avec un code 401.
>
> Le second, **`requireRole`**, vérifie que le rôle de l'utilisateur fait partie de la liste des rôles autorisés pour cette route. Si ce n'est pas le cas, il retourne un code 403 — *Forbidden*.
>
> Par exemple, pour la route qui liste tous les utilisateurs, j'ai écrit :
> *« requireAuth, puis requireRole admin uniquement, puis le contrôleur. »*
>
> Cela garantit qu'un enseignant ou un étudiant qui essaierait d'accéder à cette route — même en envoyant directement la requête depuis Postman — sera bloqué côté serveur. **La sécurité ne dépend jamais uniquement du frontend.**

---

## 6. LA PROTECTION CÔTÉ FRONTEND (1 minute)

> Côté React, j'ai mis en place trois éléments principaux :
>
> **Le AuthContext :** un contexte global qui partage l'état de l'utilisateur connecté avec tous les composants de l'application. Tout composant peut savoir qui est connecté avec un simple `useAuth()`.
>
> **Le composant ProtectedRoute :** il enveloppe les pages privées et redirige automatiquement vers la page de connexion si l'utilisateur n'est pas authentifié, ou vers une page d'erreur s'il n'a pas le bon rôle.
>
> **L'intercepteur Axios :** comme je l'ai dit, il injecte le token dans chaque requête. Mais il fait aussi autre chose : si le serveur retourne une erreur 401 — par exemple parce que le token a expiré — l'intercepteur efface automatiquement le token et redirige l'utilisateur vers la page de connexion.

---

## 7. LA SÉCURITÉ FACE AUX ATTAQUES (1 minute 30)

> Mon module a été conçu pour résister aux attaques web les plus courantes. Voici les principales mesures :
>
> Contre l'**injection SQL**, l'utilisation de Prisma garantit que toutes les requêtes sont paramétrées. Une chaîne malveillante comme `' OR '1'='1` est traitée comme une simple chaîne de caractères, jamais comme du code SQL.
>
> Contre les **attaques par force brute**, j'ai mis en place un *rate-limiting* : pas plus de 20 tentatives de connexion par adresse IP toutes les 15 minutes.
>
> Contre les **attaques XSS**, React échappe automatiquement tout contenu HTML injecté.
>
> Contre les **attaques CSRF**, l'utilisation du JWT en en-tête `Authorization` offre une protection naturelle, parce que le navigateur n'envoie jamais automatiquement cet en-tête lors d'une requête cross-origin.
>
> Et enfin, contre la **falsification de tokens**, la signature HMAC-SHA256 garantit que toute modification du token, même d'un seul bit, est détectée et rejetée.

---

## 8. LES TESTS ET LA VALIDATION (45 secondes)

> Pour valider mon travail, j'ai mené une campagne de tests comprenant **16 scénarios fonctionnels** et **4 tests de sécurité**.
>
> Les tests fonctionnels couvrent toutes les situations : connexion valide, connexion invalide, accès sans token, accès avec un token expiré, tentatives d'élévation de privilèges, et redirections automatiques selon le rôle.
>
> Les tests de sécurité simulent de vraies attaques : force brute sur la route de login, falsification de signature JWT, injection SQL, et tentatives d'accès à des routes administrateur depuis un compte étudiant.
>
> **Tous ces tests sont passés avec succès**, et la couverture de code du module Auth atteint **92 %**.

---

## 9. LES DIFFICULTÉS RENCONTRÉES (45 secondes)

> Le principal défi auquel j'ai été confronté concerne la **synchronisation des rôles**. Imaginez ce scénario : un enseignant est connecté avec son token, et entre-temps, l'administrateur change son rôle. Que se passe-t-il ?
>
> Comme le JWT contient le rôle au moment de la connexion, l'utilisateur garde théoriquement son ancien rôle jusqu'à expiration du token, soit potentiellement 24 heures.
>
> Pour résoudre ce problème, j'ai ajouté une vérification en base de données sur les routes les plus sensibles : avant d'autoriser une action critique, le serveur vérifie que le rôle dans la base correspond bien à celui du token. C'est un compromis entre performance et sécurité que j'ai jugé nécessaire.

---

## 10. PERSPECTIVES ET AMÉLIORATIONS (45 secondes)

> Plusieurs pistes d'amélioration sont envisageables pour la suite :
>
> - L'ajout d'une **authentification multi-facteurs (MFA)** pour les comptes administrateurs, via un code TOTP envoyé sur leur téléphone.
> - L'implémentation des **Refresh Tokens** pour permettre des sessions longues sans compromettre la sécurité.
> - L'intégration d'un **Single Sign-On** avec les systèmes existants de l'université.
> - La mise en place d'un **journal d'audit** pour tracer toutes les actions sensibles : connexions, modifications de rôle, suppressions de comptes.

---

## CONCLUSION (30 secondes)

> En conclusion, le module que j'ai développé constitue la **fondation sécuritaire** de toute notre plateforme. Il est conforme aux standards internationaux — RFC 7519 pour le JWT, OWASP Top 10 pour la sécurité — et il a été validé par une campagne de tests rigoureuse.
>
> Ce projet m'a permis d'approfondir mes connaissances en sécurité applicative, en architecture logicielle moderne, et m'a confronté à des problématiques réelles qui se posent dans tout système multi-utilisateurs.
>
> **Je vous remercie pour votre attention, et je suis maintenant à votre disposition pour répondre à vos questions.**

---

## CONSEILS POUR LA PRÉSENTATION

| Aspect | Conseil |
|---|---|
| **Durée totale** | Environ 10–12 minutes en parlant calmement |
| **Rythme** | Faire une pause après chaque chiffre clé (250 ms, 24 h, 92 %, etc.) |
| **Regard** | Regarder alternativement les 3 membres du jury, pas seulement l'encadreur |
| **Mains** | Garder les mains visibles, éviter de les croiser ou de jouer avec un stylo |
| **Slides** | Synchroniser le texte avec les slides — ne jamais lire directement |
| **Si vous bloquez** | Dire *« Pour résumer ce point... »* et reformuler |
| **Questions du jury** | Toujours répéter la question avant d'y répondre — cela donne 5 secondes pour réfléchir |
| **Vocabulaire** | Utiliser les termes techniques précis (JWT, RBAC, bcrypt, middleware) — cela montre la maîtrise |
| **Si vous ne savez pas** | Dire *« C'est une excellente remarque, je n'avais pas envisagé cet angle »* — honnêteté > bluff |

---

## CHIFFRES CLÉS À RETENIR

| Métrique | Valeur |
|---|---|
| Durée de validité du token JWT | 24 heures |
| Facteur de coût bcrypt | 12 (≈ 250 ms par hachage) |
| Algorithme de signature | HMAC-SHA256 |
| Rate-limiting login | 20 tentatives / 15 min / IP |
| Nombre de rôles RBAC | 3 (admin, teacher, student) |
| Tests fonctionnels | 16 scénarios — 100 % PASS |
| Tests de sécurité | 4 attaques simulées — 100 % bloquées |
| Couverture de code module Auth | 92 % |
| Standards respectés | RFC 7519 (JWT), RFC 6750 (Bearer), OWASP Top 10 |

---

**Bonne soutenance !**
