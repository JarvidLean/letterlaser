// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    console.log('Canvas found:', canvas);

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    console.log('Canvas size set to:', canvas.width, 'x', canvas.height);

    // Initialize game
    console.log('Creating game instance...');
    const game = new Game(canvas);
    console.log('Game instance created');

    // Start game loop
    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }

    // Start the game
    console.log('Starting game loop...');
    gameLoop();
}); 