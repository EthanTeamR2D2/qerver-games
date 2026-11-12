# Qerver Arcade

Une petite arcade dans le navigateur avec Pong (2 joueurs), Tetris et Snake. Les jeux sont écrits en HTML, CSS et JavaScript, sans dépendance à installer.

## Lancer le site

Depuis le dossier du projet, démarre le serveur statique intégré à Python :

```bash
python3 -m http.server 8000
```

Sous Windows, tu peux utiliser `py -m http.server 8000`. Ouvre ensuite [http://localhost:8000](http://localhost:8000). Pour arrêter le serveur, fais `Ctrl+C` dans le terminal.

## Commandes

- **Pong** : joueur 1 avec `W` / `S`, joueur 2 avec `↑` / `↓`. Premier à 7 points.
- **Tetris** : `←` / `→` pour déplacer, `↑` pour tourner, `↓` pour descendre, `Espace` pour faire tomber la pièce.
- **Snake** : flèches ou `W` / `A` / `S` / `D` pour tourner.
- **Tous les jeux** : `P` pour mettre en pause, `Échap` pour revenir au menu. Après une défaite, `Entrée` recommence.
