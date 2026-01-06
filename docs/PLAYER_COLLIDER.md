# Dostosowywanie Collidera Gracza

## Wyświetlanie Collidera (Debug Mode)

Debug mode jest już włączony w `src/config/GameConfig.ts`:

```typescript
debug: {
  showColliders: true,     // Pokaż wireframe collider boxes
  colliderColor: '0 1 0',   // Zielony dla obiektów, czerwony dla gracza
  colliderOpacity: 0.3      // Przezroczystość 0-1
}
```

Collider gracza jest **czerwony**, a innych obiektów **zielony**.

## Zmiana Rozmiaru Collidera

Rozmiar collidera gracza jest w `src/config/GameConfig.ts`:

```typescript
player: {
  size: {
    width: 0.8,   // Szerokość collidera (oś X)
    height: 1.2,  // Wysokość collidera (oś Y)
    depth: 0.8    // Głębokość collidera (oś Z)
  },
  // ... inne opcje
}
```

### Dopasowanie do Modelu Racoon

Model racoon ma wbudowaną skalę `0.430886` w pliku X3D, a w HTML ustawiamy dodatkowo skalę `1 1 1`.

**Przykładowe dopasowanie:**

```typescript
// W src/config/GameConfig.ts lub w src/main.ts gdy tworzysz Game:
player: {
  size: {
    width: 0.6,   // Węższa postać
    height: 1.0,  // Niższa (racoon jest mały)
    depth: 0.6    // Węższa z przodu/tyłu
  }
}
```

### Zmiana w Czasie Developmentu

Jeśli chcesz szybko testować różne rozmiary, możesz zmienić w `src/main.ts`:

```typescript
const app = new GameApplication();

// Lub gdy tworzysz nową grę z custom config:
const game = new Game({
  player: {
    size: {
      width: 0.5,   // Testuj różne wartości
      height: 0.9,
      depth: 0.5
    }
  }
});
```

## Wskazówki Dopasowania

1. **Uruchom grę z debug mode** - zobaczysz czerwony wireframe collidera
2. **Porównaj z modelem racoon** - wireframe powinien obudowywać model
3. **Dostosuj width/depth** - żeby collider nie był za szeroki
4. **Dostosuj height** - żeby pasował do wysokości modelu
5. **Testuj gameplay** - upewnij się że gracz nie jest za mały/duży dla poziomów

## Pozycja Startowa

Możesz też zmienić wysokość startową gracza:

```typescript
player: {
  startPosition: {
    x: 0,
    y: 2  // Wyżej jeśli model jest niżej osadzony
  }
}
```

## Przykład - Mniejszy Collider dla Racoon

```typescript
// src/config/GameConfig.ts
export const DEFAULT_CONFIG: GameConfig = {
  player: {
    speed: 6,
    maxSpeed: 12,
    acceleration: 50,
    deceleration: 80,
    jumpForce: 20,
    size: {
      width: 0.6,    // ← Zmniejszone z 0.8
      height: 1.0,   // ← Zmniejszone z 1.2
      depth: 0.6     // ← Zmniejszone z 0.8
    },
    startPosition: {
      x: 0,
      y: 2           // ← Wyżej z 1
    },
    // ... reszta config
  }
}
```

Po zapisaniu zmian, odśwież grę i zobacz różnicę!

