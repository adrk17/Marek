# Workflow tworzenia modeli 3D

## Najprostszy workflow: Blender

### 1. Instalacja
- Pobierz Blender: https://www.blender.org/download/

### 2. Tworzenie modelu

```
1. Otwórz Blender
2. Usuń domyślny sześcian (X → Delete)
3. Shift+A → Mesh → wybierz kształt bazowy
4. Tab → tryb Edit Mode do edycji
5. Dodaj materiały w panelu Properties → Material
```

### 3. Eksport do X3D

```
File → Export → X3D Extensible 3D (.x3d)

Opcje eksportu:
✅ Triangulate
✅ Normals
✅ Apply Modifiers
```

### 4. Umieść plik w projekcie
```
public/models/twoj_model.x3d
```

---

## Tworzenie template

### 1. Zmierz model w Blenderze
- W Edit Mode zaznacz cały model (A)
- Panel Properties → Item → Dimensions

### 2. Dodaj do templates/index.json

```json
{
  "id": "moj_model",
  "name": "Mój Model",
  "x3dUrl": "/models/moj_model.x3d",
  "collider": {
    "size": { "x": 2, "y": 1, "z": 2 },
    "offset": { "x": 0, "y": 0, "z": 0 }
  },
  "defaultType": "platform",
  "modelScale": 1
}
```

### 3. Użyj w poziomie

```json
{
  "id": "platform1",
  "templateId": "moj_model",
  "position": { "x": 5, "y": 2, "z": 0 }
}
```

---

## Debug: Dopasowanie collidera

Włącz tryb debug w kodzie:

```typescript
const config = createConfig({
  debug: {
    showColliders: true,
    colliderColor: '0 1 0',
    colliderOpacity: 0.5
  }
});
```

Zobaczysz zielony wireframe collidera obok modelu - łatwo dopasować `modelScale` i `collider.size`.

---

## Alternatywa: Blockbench (prostsze modele)

1. Pobierz: https://www.blockbench.net/
2. Stwórz model w stylu voxel/pixel
3. File → Export → OBJ
4. Importuj OBJ do Blendera
5. Eksportuj jako X3D

---

## Struktura folderów

```
public/
├── models/           # Pliki .x3d
│   ├── brick_platform.x3d
│   ├── pipe_green.x3d
│   └── coin_gold.x3d
├── textures/         # Tekstury dla modeli
│   └── brick.png
└── templates/
    └── index.json    # Definicje templates
```

---

## Tips

1. **Origin point** - ustaw origin modelu na środek dolnej krawędzi (Object → Set Origin)
2. **Skala** - pracuj w jednostkach gdzie 1 unit = 1 metr w grze
3. **Nazewnictwo** - używaj snake_case dla plików
4. **Tekstury** - użyj ścieżek względnych w Blenderze przed eksportem
