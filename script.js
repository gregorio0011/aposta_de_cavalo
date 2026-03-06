/**
 * TURF STAR - Horse Racing Game
 * Core Logic and Game Engine
 */

class Horse {
    constructor(id, name, color, stats) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.stats = {
            speed: stats.speed,       // Base velocity
            acceleration: stats.acc,  // How fast it reaches top speed
            stamina: stats.stam,      // How long it maintains speed
            luck: stats.luck          // Random boost chance
        };

        this.reset();
    }

    reset() {
        this.position = 0;
        this.currentSpeed = 0;
        this.energy = 100;
        this.distanceCovered = 0;
        this.finished = false;
        this.finishTime = 0;
        this.isExhausted = false;
    }

    update(dt, terrainFactor, trackLength) {
        if (this.finished) return;

        // Stamina consumption
        if (this.currentSpeed > this.stats.speed * 0.8) {
            this.energy -= (this.currentSpeed / this.stats.speed) * (11 - this.stats.stamina) * dt;
        }

        // Exhaustion effect
        if (this.energy <= 0) {
            this.energy = 0;
            this.isExhausted = true;
        }

        // Calculate Target Speed
        let targetSpeed = this.stats.speed * terrainFactor;

        // Luck factor (RNG)
        const luckRoll = Math.random() * 100;
        if (luckRoll < this.stats.luck) {
            targetSpeed *= 1.2; // 20% boost
        }

        // If exhausted, slow down significantly
        if (this.isExhausted) {
            targetSpeed *= 0.5;
        }

        // Acceleration
        const accRate = this.stats.acceleration * 0.1;
        if (this.currentSpeed < targetSpeed) {
            this.currentSpeed += accRate * dt;
        } else {
            this.currentSpeed -= accRate * 0.5 * dt; // Slow down to target
        }

        // Update position
        this.distanceCovered += this.currentSpeed * dt;
        this.position = (this.distanceCovered / trackLength) * 100;

        if (this.distanceCovered >= trackLength) {
            this.distanceCovered = trackLength;
            this.position = 100;
            this.finished = true;
        }
    }
}

class RaceManager {
    constructor() {
        this.horses = [];
        this.trackLength = 10000; // arbitrary units
        this.timer = 0;
        this.isActive = false;
        this.terrain = 'grass';
        this.terrainFactors = {
            grass: 1.0,
            sand: 0.85,
            mud: 0.7
        };
        this.winners = [];
    }

    setupRace(horses, terrain) {
        this.horses = horses;
        this.terrain = terrain;
        this.timer = 0;
        this.winners = [];
        this.horses.forEach(h => h.reset());
        this.isActive = true;
    }

    update(dt) {
        if (!this.isActive) return;

        this.timer += dt;
        const factor = this.terrainFactors[this.terrain];

        let allFinished = true;
        this.horses.forEach(horse => {
            if (!horse.finished) {
                horse.update(dt, factor, this.trackLength);
                if (horse.finished) {
                    horse.finishTime = this.timer;
                    this.winners.push(horse);
                } else {
                    allFinished = false;
                }
            }
        });

        if (allFinished) {
            this.isActive = false;
            return true; // Race finished
        }
        return false;
    }

    getLeader() {
        return [...this.horses].sort((a, b) => b.distanceCovered - a.distanceCovered)[0];
    }
}

class Game {
    constructor() {
        this.balance = 1000;
        this.selectedHorse = null;
        this.currentBet = 0;
        this.currentTerrain = 'grass';
        this.manager = new RaceManager();
        this.horses = [
            new Horse(0, "Thunderbolt", "brown", { speed: 85, acc: 7, stam: 8, luck: 15 }),
            new Horse(1, "Wind Runner", "white", { speed: 92, acc: 6, stam: 5, luck: 10 }),
            new Horse(2, "Shadow Blade", "black", { speed: 80, acc: 9, stam: 6, luck: 25 }),
            new Horse(3, "Golden Hoof", "chestnut", { speed: 75, acc: 8, stam: 9, luck: 5 })
        ];

        this.init();
    }

    init() {
        const terrains = ['grass', 'sand', 'mud'];
        const terrainNames = { grass: 'Grama', sand: 'Areia', mud: 'Lama' };
        const terrainDescriptions = {
            grass: 'Velocidade total e curvas suaves.',
            sand: 'Exige mais resistência dos cavalos.',
            mud: 'Lento e imprevisível. Sorte é fundamental.'
        };

        this.currentTerrain = terrains[Math.floor(Math.random() * terrains.length)];
        document.getElementById('track-name').textContent = terrainNames[this.currentTerrain];
        document.getElementById('track-description').textContent = terrainDescriptions[this.currentTerrain];

        this.renderLobby();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Bet Buttons
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.setBet(amount);
                document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        document.getElementById('custom-bet').addEventListener('input', (e) => {
            const amount = parseInt(e.target.value) || 0;
            this.setBet(amount);
            document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
        });

        document.getElementById('start-race-btn').addEventListener('click', () => {
            this.startRace();
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.goToLobby();
        });
    }

    renderLobby() {
        const container = document.getElementById('horse-cards');
        container.innerHTML = '';

        this.horses.forEach(horse => {
            const card = document.createElement('div');
            card.className = 'horse-card';
            if (this.selectedHorse === horse) card.classList.add('selected');

            card.innerHTML = `
                <div class="tag">ODDS: ${this.calculateOdds(horse)}</div>
                <div class="horse-info">
                    <h3>${horse.name}</h3>
                    <div class="stats">
                        <div class="stat-row">
                            <span>Velocidade</span>
                            <div class="stat-bar"><div class="stat-fill" style="width: ${horse.stats.speed}%"></div></div>
                        </div>
                        <div class="stat-row">
                            <span>Aceleração</span>
                            <div class="stat-bar"><div class="stat-fill" style="width: ${horse.stats.acceleration * 10}%"></div></div>
                        </div>
                        <div class="stat-row">
                            <span>Resistência</span>
                            <div class="stat-bar"><div class="stat-fill" style="width: ${horse.stats.stamina * 10}%"></div></div>
                        </div>
                    </div>
                </div>
            `;

            card.onclick = () => this.selectHorse(horse);
            container.appendChild(card);
        });

        document.getElementById('balance-display').textContent = `Saldo: $${this.balance}`;
    }

    calculateOdds(horse) {
        // Simple odds calculation based on speed
        return (100 / horse.stats.speed * 2).toFixed(1) + 'x';
    }

    selectHorse(horse) {
        this.selectedHorse = horse;
        this.renderLobby();
        document.getElementById('betting-panel').classList.remove('hidden');
        this.updateBetSummary();
    }

    setBet(amount) {
        if (amount > this.balance) amount = this.balance;
        this.currentBet = amount;
        this.updateBetSummary();
    }

    updateBetSummary() {
        if (!this.selectedHorse) return;
        const potentialWin = (this.currentBet * parseFloat(this.calculateOdds(this.selectedHorse))).toFixed(0);
        document.getElementById('bet-summary').textContent =
            `Apostando $${this.currentBet} em ${this.selectedHorse.name}. Ganho potencial: $${potentialWin}`;
    }

    startRace() {
        if (!this.selectedHorse || this.currentBet <= 0) return;

        this.balance -= this.currentBet;

        // UI Transition
        document.getElementById('lobby').classList.remove('active');
        document.getElementById('race-screen').classList.add('active');

        this.setupRaceTrack();

        this.manager.setupRace(this.horses, this.currentTerrain);
        this.lastTime = 0;
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupRaceTrack() {
        const container = document.getElementById('horses-layer');
        container.innerHTML = '';

        this.horses.forEach((horse, index) => {
            const div = document.createElement('div');
            div.id = `horse-obj-${horse.id}`;
            div.className = 'horse-sprite-container running';
            div.style.top = `${index * 100 + 50}px`;

            div.innerHTML = `
                <div class="horse-label">${horse.name}</div>
                <div class="horse-sprite" style="background-image: url('assets/horses.png'); filter: hue-rotate(${index * 90}deg); background-size: 400% 100%; background-position: ${index * 33.3}% 0%;"></div>
            `;
            container.appendChild(div);
        });
    }

    gameLoop(timestamp) {
        if (!this.lastTime) {
            this.lastTime = timestamp;
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }
        const dt = Math.min((timestamp - this.lastTime) / 16.67, 5);
        this.lastTime = timestamp;

        const finished = this.manager.update(dt);
        this.updateRaceUI();

        if (finished) {
            setTimeout(() => this.showResult(), 1000);
        } else {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    updateRaceUI() {
        this.horses.forEach(horse => {
            const el = document.getElementById(`horse-obj-${horse.id}`);
            if (el) {
                // We use distanceCovered to shift the horse
                // The camera follows the lead horse
                const leader = this.manager.getLeader();
                const trackWidth = window.innerWidth;
                const centerOffset = trackWidth / 3;

                // Calculate position relative to track and camera
                const screenX = (horse.distanceCovered - leader.distanceCovered) * 2 + centerOffset;
                el.style.left = `${screenX}px`;
            }
        });

        // Background scrolling
        const leader = this.manager.getLeader();
        const bg = document.getElementById('track-background');
        bg.style.transform = `translateX(${-leader.distanceCovered % 2000}px)`;

        // HUD
        const progress = (leader.distanceCovered / this.manager.trackLength) * 100;
        document.getElementById('global-progress').style.width = `${progress}%`;
        document.getElementById('current-leader').textContent = leader.name;
    }

    showResult() {
        const winner = this.manager.winners[0];
        document.getElementById('race-screen').classList.remove('active');
        document.getElementById('result-screen').classList.add('active');

        document.getElementById('winner-name').textContent = winner.name;
        document.getElementById('winner-sprite').style.backgroundImage = `url('assets/horses.png')`;
        document.getElementById('winner-sprite').style.filter = `hue-rotate(${winner.id * 90}deg)`;
        document.getElementById('winner-sprite').style.backgroundSize = '400% 100%';
        document.getElementById('winner-sprite').style.backgroundPosition = `${winner.id * 33.3}% 0%`;

        if (winner === this.selectedHorse) {
            const odds = parseFloat(this.calculateOdds(winner));
            const winAmount = Math.floor(this.currentBet * odds);
            this.balance += winAmount;
            document.getElementById('result-title').textContent = "VITÓRIA!";
            document.getElementById('result-message').textContent = `Parabéns! Você ganhou $${winAmount}!`;
            document.getElementById('result-title').style.color = "var(--secondary)";
        } else {
            document.getElementById('result-title').textContent = "DERROTA";
            document.getElementById('result-message').textContent = `Que azar! ${winner.name} venceu a corrida.`;
            document.getElementById('result-title').style.color = "var(--error)";
        }
    }

    goToLobby() {
        document.getElementById('result-screen').classList.remove('active');
        document.getElementById('lobby').classList.add('active');
        this.selectedHorse = null;
        this.currentBet = 0;
        this.renderLobby();
        document.getElementById('betting-panel').classList.add('hidden');
    }
}

// Start Game
window.onload = () => {
    new Game();
}
