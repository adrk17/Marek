import type { LevelManifest } from '../LevelCatalog';
import type { LeaderboardEntry, PlayerProfile } from '../storage/GameStorage';

export interface MenuCallbacks {
  onLevelSelected?(level: LevelManifest): void;
  onPlay?(level: LevelManifest): void;
  onProfileSave?(nickname: string): void;
}

export class MenuUI {
  private root: HTMLDivElement;
  private tabButtons: Record<'newGame' | 'profile', HTMLButtonElement>;
  private tabPanels: Record<'newGame' | 'profile', HTMLDivElement>;
  private levelList: HTMLDivElement;
  private levelDetails: HTMLDivElement;
  private leaderboardBody: HTMLTableSectionElement;
  private profileInput: HTMLInputElement;
  private playButton: HTMLButtonElement;
  private profileNameLabel: HTMLSpanElement | null;

  private levels: LevelManifest[] = [];
  private selectedLevelId: string | null = null;
  private callbacks: MenuCallbacks;

  constructor(callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.id = 'game-menu';
    this.root.innerHTML = `
      <div class="menu-card">
        <header class="menu-header">
          <div class="menu-header-row">
            <h1>Marek the Raccoon</h1>
            <div class="menu-profile-status">
              <span class="label">Active Profile:</span>
              <span class="value menu-profile-name">Guest</span>
            </div>
          </div>
          <nav class="menu-tabs">
            <button data-tab="newGame" class="active">New Game</button>
            <button data-tab="profile">Profile</button>
          </nav>
        </header>
        <section class="menu-body">
          <div class="menu-panel active" data-tab-panel="newGame">
            <div class="menu-columns">
              <div class="menu-levels">
                <h2>Levels</h2>
                <div class="menu-level-list"></div>
              </div>
              <div class="menu-level-details">
                <div class="menu-level-info">
                  <h2>Select a level to play</h2>
                  <p class="menu-level-description">Choose a level from the list to view details and leaderboard.</p>
                  <ul class="menu-level-meta"></ul>
                </div>
                <div class="menu-leaderboard">
                  <h3>Leaderboard</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nick</th>
                        <th>Time (s)</th>
                        <th>Coins</th>
                        <th>Height Bonus</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody></tbody>
                  </table>
                  <div class="menu-leaderboard-empty">No runs yet.</div>
                </div>
                <div class="menu-actions">
                  <button class="menu-play" disabled>Play</button>
                </div>
              </div>
            </div>
          </div>
          <div class="menu-panel" data-tab-panel="profile">
            <form class="menu-profile-form">
              <h2>Player Profile</h2>
              <label>
                <span>Nickname</span>
                <input type="text" name="nickname" maxlength="24" placeholder="Enter your nickname" required />
              </label>
              <button type="submit">Save Profile</button>
            </form>
          </div>
        </section>
      </div>
    `;

    this.tabButtons = {
      newGame: this.root.querySelector('[data-tab="newGame"]') as HTMLButtonElement,
      profile: this.root.querySelector('[data-tab="profile"]') as HTMLButtonElement
    };
    this.tabPanels = {
      newGame: this.root.querySelector('[data-tab-panel="newGame"]') as HTMLDivElement,
      profile: this.root.querySelector('[data-tab-panel="profile"]') as HTMLDivElement
    };
    this.levelList = this.root.querySelector('.menu-level-list') as HTMLDivElement;
    this.levelDetails = this.root.querySelector('.menu-level-info') as HTMLDivElement;
    this.leaderboardBody = this.root.querySelector('.menu-leaderboard tbody') as HTMLTableSectionElement;
    this.profileInput = this.root.querySelector('input[name="nickname"]') as HTMLInputElement;
    this.playButton = this.root.querySelector('.menu-play') as HTMLButtonElement;
    this.profileNameLabel = this.root.querySelector('.menu-profile-name') as HTMLSpanElement | null;

    this.root.style.display = 'none';
    document.body.appendChild(this.root);

    this.attachEvents();
  }

  show(): void {
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  setLevels(levels: LevelManifest[], activeLevelId?: string): void {
    this.levels = levels.slice();
    this.renderLevelList(activeLevelId);
  }

  setProfile(profile: PlayerProfile): void {
    const nickname = profile.nickname ?? '';
    const displayName = nickname.trim() || 'Guest';
    this.profileInput.value = displayName;
    if (this.profileNameLabel) {
      this.profileNameLabel.textContent = displayName;
    }
  }

  focusProfileInput(): void {
    this.switchTab('profile');
    setTimeout(() => this.profileInput.focus(), 0);
  }

  setLeaderboard(entries: LeaderboardEntry[]): void {
    this.leaderboardBody.innerHTML = '';
    const emptyState = this.root.querySelector('.menu-leaderboard-empty') as HTMLDivElement;
    if (!entries.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${escapeHTML(entry.nickname)}</td>
        <td>${entry.time.toFixed(2)}</td>
        <td>${entry.coins}</td>
        <td>${entry.heightBonus}</td>
        <td>${entry.score}</td>
      `;
      this.leaderboardBody.appendChild(row);
    });
  }

  selectLevel(levelId: string): void {
    this.selectedLevelId = levelId;
    const buttons = this.levelList.querySelectorAll('button[data-level-id]');
    buttons.forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-level-id') === levelId);
    });
    const manifest = this.levels.find((level) => level.id === levelId);
    if (manifest) {
      this.updateLevelDetails(manifest);
      this.playButton.disabled = false;
    } else {
      this.playButton.disabled = true;
    }
  }

  private attachEvents(): void {
    this.tabButtons.newGame.addEventListener('click', () => this.switchTab('newGame'));
    this.tabButtons.profile.addEventListener('click', () => this.switchTab('profile'));

    this.playButton.addEventListener('click', () => {
      if (!this.selectedLevelId) return;
      const manifest = this.levels.find((level) => level.id === this.selectedLevelId);
      if (manifest && this.callbacks.onPlay) {
        this.callbacks.onPlay(manifest);
      }
    });

    const form = this.root.querySelector('.menu-profile-form') as HTMLFormElement;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nickname = this.profileInput.value.trim();
      if (nickname && this.callbacks.onProfileSave) {
        this.callbacks.onProfileSave(nickname);
      }
    });
  }

  private switchTab(tab: 'newGame' | 'profile'): void {
    const tabs: Array<'newGame' | 'profile'> = ['newGame', 'profile'];
    for (const key of tabs) {
      this.tabButtons[key].classList.toggle('active', key === tab);
      this.tabPanels[key].classList.toggle('active', key === tab);
    }
  }

  private renderLevelList(activeLevelId?: string): void {
    this.levelList.innerHTML = '';
    if (!this.levels.length) {
      const empty = document.createElement('p');
      empty.className = 'menu-empty';
      empty.textContent = 'No levels found.';
      this.levelList.appendChild(empty);
      return;
    }

    this.levels.forEach((level) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = level.name;
      button.setAttribute('data-level-id', level.id);
      button.addEventListener('click', () => {
        this.selectLevel(level.id);
        if (this.callbacks.onLevelSelected) {
          this.callbacks.onLevelSelected(level);
        }
      });
      this.levelList.appendChild(button);
    });

    if (activeLevelId) {
      this.selectLevel(activeLevelId);
    } else {
      const first = this.levels[0];
      if (first) {
        this.selectLevel(first.id);
        if (this.callbacks.onLevelSelected) {
          this.callbacks.onLevelSelected(first);
        }
      }
    }
  }

  private updateLevelDetails(level: LevelManifest): void {
    const title = this.levelDetails.querySelector('h2') as HTMLHeadingElement;
    const description = this.levelDetails.querySelector('.menu-level-description') as HTMLParagraphElement;
    const metaList = this.levelDetails.querySelector('.menu-level-meta') as HTMLUListElement;

    title.textContent = level.name;
    description.textContent = level.description ?? 'No description available.';
    metaList.innerHTML = '';

    if (level.difficulty) {
      metaList.appendChild(this.createMetaItem('Difficulty', level.difficulty));
    }
    if (level.author) {
      metaList.appendChild(this.createMetaItem('Author', level.author));
    }
    if (level.metadata) {
      for (const key of Object.keys(level.metadata)) {
        const rawValue = level.metadata[key];
        if (rawValue === undefined || rawValue === null) continue;
        metaList.appendChild(this.createMetaItem(capitalize(key), String(rawValue)));
      }
    }
  }

  private createMetaItem(label: string, value: string): HTMLLIElement {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${escapeHTML(label)}:</strong> ${escapeHTML(value)}`;
    return item;
  }
}

function escapeHTML(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

function capitalize(input: string): string {
  if (!input) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}
