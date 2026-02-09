<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Homelab - Home</title>
    <style>
        :root { --bg-color: #000; --text-primary: #ffffff; --accent-color: #00bcd4; }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background-color: var(--bg-color); color: var(--text-primary); overflow-x: hidden; }
        
        nav {
            position: fixed; top: 0; width: 100%; z-index: 1000;
            background-color: rgba(0,0,0,0.9); backdrop-filter: blur(5px);
            padding: 20px 5%; display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #333;
        }
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--accent-color); text-transform: uppercase; letter-spacing: 2px; cursor: pointer; }
        .nav-links a { color: var(--text-primary); text-decoration: none; margin-left: 25px; font-size: 0.9rem; }
        .nav-links a:hover { color: var(--accent-color); }

        .slideshow-container {
            position: relative; width: 100%; height: 100vh; overflow: hidden;
        }

        /* Container for the stack */
        .slides-stack {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        }
        
        .mySlides {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background-size: cover; background-position: center; 
            opacity: 0;
            transition: opacity 1.5s ease-in-out;
            z-index: 1;
        }
        
        /* The Active Slide (Top Layer) */
        .mySlides.active {
            opacity: 1;
            z-index: 10;
        }

        /* THE KEYFRAMES FOR SMOOTH SLIDING */
        @keyframes crossfade-in {
            from { opacity: 0; transform: scale(1.1); }
            to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes crossfade-out {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(1.1); }
        }

        .mySlides.active {
            animation: crossfade-in 1.5s ease-in-out forwards;
        }

        .mySlides.fade-out {
            animation: crossfade-out 1.5s ease-in-out forwards;
            z-index: 9; /* Stay under the new slide */
        }

        .slide-content {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            text-align: center; max-width: 800px; width: 90%; z-index: 20;
            text-shadow: 0 5px 15px rgba(0,0,0,0.8);
            pointer-events: none; /* Prevents clicking text while sliding */
        }
        .slide-content h1 { font-size: 3.5rem; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; line-height: 1.2; animation: fadeInText 1s ease forwards; }
        .slide-content p { font-size: 1.4rem; margin-bottom: 40px; color: #ddd; animation: fadeInText 1.2s ease forwards; }
        .slide-content span { color: var(--accent-color); font-size: 1.2rem; font-weight: bold; animation: fadeInText 1s ease forwards; }

        @keyframes fadeInText {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .btn-start {
            padding: 15px 40px; font-size: 1.2rem; background-color: var(--accent-color);
            color: white; text-decoration: none; border-radius: 30px; font-weight: bold;
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); transition: 0.3s;
            animation: fadeInText 1.5s ease forwards;
        }
        .btn-start:hover { background-color: #fff; color: #000; transform: scale(1.05); box-shadow: 0 0 20px rgba(255,255,255,0.5); }

        .prev, .next {
            cursor: pointer; position: absolute; top: 50%; width: 50px; height: 50px;
            color: white; font-weight: bold; font-size: 20px; background-color: rgba(0,0,0,0.5);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            user-select: none; transition: 0.3s; text-decoration: none; margin-top: -25px;
            border: 1px solid rgba(255,255,255,0.2); z-index: 30;
        }
        .next { right: 20px; }
        .prev { left: 20px; }
        .prev:hover, .next:hover { background-color: var(--accent-color); color: white; border-color: var(--accent-color); }
        
        .dots-container { position: absolute; bottom: 50px; width: 100%; text-align: center; z-index: 30; }
        .dot { cursor: pointer; height: 15px; width: 15px; margin: 0 8px; background-color: rgba(255,255,255,0.5); border-radius: 50%; display: inline-block; transition: background-color 0.5s; }
        .active { background-color: var(--accent-color); transform: scale(1.2); box-shadow: 0 0 10px var(--accent-color); }

        .intro-section { padding: 100px 20px; text-align: center; background-color: #0f1115; max-width: 1000px; margin: 0 auto; border-top: 1px solid #333; }
        .intro-section h2 { font-size: 2.5rem; margin-bottom: 20px; color: var(--text-primary); display: inline-block; border-bottom: 2px solid var(--accent-color); padding-bottom: 10px; }
        .intro-section p { color: #aaa; font-size: 1.1rem; margin-bottom: 50px; }
        
        .feature-links { display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-top: 30px; }
        .feature-link { text-decoration: none; color: var(--text-primary); padding: 30px; background: #1a1d23; border-radius: 10px; width: 250px; transition: 0.3s; border: 1px solid #333; }
        .feature-link:hover { transform: translateY(-5px); border-color: var(--accent-color); background: #222; }
        .feature-link h3 { color: var(--accent-color); margin-bottom: 10px; font-size: 1.5rem; }

        footer { text-align: center; padding: 40px; background-color: #000; color: #666; font-size: 0.9rem; }
    </style>
</head>
<body>

    <nav>
        <div class="logo" onclick="currentSlide(1)">MyHomelab</div>
        <div class="nav-links">
            <a href="index.php" style="color: var(--accent-color);">Home</a>
            <a href="gear.php">Hardware</a>
            <a href="gallery.php">Gallery</a>
            <a href="contact.php">Contact</a>
        </div>
    </nav>

    <div class="slideshow-container">
        <div class="slides-stack">
            <!-- Slide 1 -->
            <div class="mySlides active" style="background-image: url('https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop');">
                <div class="slide-content">
                    <h1>Infrastructure Enthusiast</h1>
                    <p>Building resilient, automated systems in my personal data center.</p>
                    <a href="gear.html" class="btn-start">Explore The Setup</a>
                </div>
            </div>

            <!-- Slide 2 -->
            <div class="mySlides" style="background-image: url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop');">
                <div class="slide-content">
                    <h1>10 Gigabit Core</h1>
                    <p>High-speed networking and 24/7 uptime reliability.</p>
                    <span style="color:var(--accent-color); font-size: 1.2rem; font-weight:bold;">Speed meets Stability.</span>
                </div>
            </div>
        </div>

        <a class="prev" onclick="plusSlides(-1)">&#10094;</a>
        <a class="next" onclick="plusSlides(1)">&#10095;</a>

        <div class="dots-container">
            <span class="dot active" onclick="currentSlide(1)"></span>
            <span class="dot" onclick="currentSlide(2)"></span>
        </div>
    </div>

    <section class="intro-section">
        <h2>Welcome to the Lab</h2>
        <p>Documenting the journey from a single Raspberry Pi to a fully functional home data center.</p>
        
        <div class="feature-links">
            <a href="gear.html" class="feature-link">
                <h3>⚙️ Hardware</h3>
                <p>Check out the specs on my servers, storage, and network equipment.</p>
            </a>
            <a href="gallery.html" class="feature-link">
                <h3>📸 Gallery</h3>
                <p>Photos from the rack and desk setups.</p>
            </a>
            <a href="contact.html" class="feature-link">
                <h3>📩 Contact</h3>
                <p>Have a question? Send me a message.</p>
            </a>
        </div>
    </section>

    <footer>
        <p>&copy; <span id="year"></span> [Your Name] Homelab.</p>
    </footer>

    <script>
        let slideIndex = 1;
        let slideTimer;
        let isAnimating = false;

        showSlides(slideIndex);
        startAutoPlay();

        function plusSlides(n) {
            clearTimeout(slideTimer);
            if (isAnimating) return; // Prevent clicks while animating
            isAnimating = true;
            showSlides(slideIndex += n);
            startAutoPlay();
        }

        function currentSlide(n) {
            clearTimeout(slideTimer);
            if (isAnimating) return;
            isAnimating = true;
            showSlides(slideIndex = n);
            startAutoPlay();
        }

        function showSlides(n) {
            let slides = document.getElementsByClassName("mySlides");
            let dots = document.getElementsByClassName("dot");
            
            if (n > slides.length) {slideIndex = 1}
            if (n < 1) {slideIndex = slides.length}
            
            // Remove all classes first
            for (let i = 0; i < slides.length; i++) {
                slides[i].className = "mySlides";
                dots[i].className = "dot";
            }

            // Add classes for the animation
            slides[slideIndex-1].classList.add("active");
            dots[slideIndex-1].classList.add("active");

            // If we have a previous slide, trigger fade out
            let previousIndex = (slideIndex === 1) ? slides.length : slideIndex - 1;
            if (previousIndex !== slideIndex) {
                slides[previousIndex-1].classList.add("fade-out");
            }

            // Unlock the slider after animation
            setTimeout(() => {
                isAnimating = false;
            }, 1500); // Matches CSS transition time
        }

        function startAutoPlay() {
            slideTimer = setInterval(function() {
                if (!isAnimating) {
                    plusSlides(1);
                }
            }, 6000);
        }
    </script>
</body>
</html>