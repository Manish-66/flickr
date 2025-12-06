// Favourite Toggle Button of leftside 
const star = document.querySelector('.star');
const spcl1 = document.getElementById('spcl1');
const mid = document.querySelector('.mid');

let toggled1 = false;

star.addEventListener('click', () => {
    toggled1 = !toggled1;

    if (toggled1) {
        spcl2.classList.add('hide');
        spcl3.classList.add('hide');
        toggled2 = false;
        toggled3 = false;
        mid.style.width = 'calc(96% - 80px)';
        mid.style.width = 'calc(96% - 80px - 450px)';
        setTimeout(() => {
            spcl1.classList.remove('hide');
        }, 300);
    } else {
        spcl1.classList.add('hide');
        mid.style.width = 'calc(96% - 80px)';
    }
});


// Unlock Toggle Button of leftside
const unlock = document.querySelector('.unlock');
const spcl2 = document.getElementById('spcl2');

let toggled2 = false;

unlock.addEventListener('click', () => {
    toggled2 = !toggled2;

    if (toggled2) {
        spcl1.classList.add('hide');
        spcl3.classList.add('hide');
        toggled1 = false;
        toggled3 = false;
        mid.style.width = 'calc(96% - 80px)';
        mid.style.width = 'calc(96% - 80px - 450px)';
        setTimeout(() => {
            spcl2.classList.remove('hide');
        }, 300);
    } else {
        spcl2.classList.add('hide');
        mid.style.width = 'calc(96% - 80px)';
    }
});

// Upload Toggle Button of leftside
const upload = document.querySelector('.upload');
const spcl3 = document.getElementById('spcl3');

let toggled3 = false;

upload.addEventListener('click', () => {
    toggled3 = !toggled3;

    if (toggled3) {
        spcl2.classList.add('hide');
        spcl1.classList.add('hide');
        toggled2 = false;
        toggled1 = false;
        mid.style.width = 'calc(96% - 80px)';
        mid.style.width = 'calc(96% - 80px - 450px)';
        setTimeout(() => {
            spcl3.classList.remove('hide');
        }, 300);
    } else {
        spcl3.classList.add('hide');
        mid.style.width = 'calc(96% - 80px)';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    window.location.href = '/logout';
});

//greeting text
fetch('/api/user')
    .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
    })
    .then(data => {
        const greetingDiv = document.querySelector('.greeting');
        if (greetingDiv) {
            greetingDiv.textContent = `Hi, ${data.name}`;
        }
    })
    .catch(err => {
        console.error(err);
    });


//the buttons and the mid div
document.addEventListener('DOMContentLoaded', async () => {
    const midImg = document.querySelector('.midimg');
    const leftBtn = document.querySelector('#left01');
    const rightBtn = document.querySelector('#right01');
    const favBtn = document.querySelector('#fav01');
    let imageUrls = [];
    let currentIndex = 0;
    let intervalId;

    try {
        const response = await fetch('/unlocked-images');
        imageUrls = await response.json();
        if (imageUrls.length === 0) return;

        midImg.src = imageUrls[currentIndex];

        function showImage(index) {
            midImg.style.opacity = 0;
            setTimeout(() => {
                midImg.src = imageUrls[index];
                midImg.style.opacity = 1;
            }, 300);
        }

        function nextImage() {
            currentIndex = (currentIndex + 1) % imageUrls.length;
            showImage(currentIndex);
        }

        function prevImage() {
            currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
            showImage(currentIndex);
        }

        // Start auto-cycling
        intervalId = setInterval(nextImage, 5000);

        // Stop auto-cycling on manual click
        function stopAutoCycle() {
            clearInterval(intervalId);
            intervalId = null;
        }

        rightBtn.addEventListener('click', () => {
            nextImage();
            stopAutoCycle();
        });

        leftBtn.addEventListener('click', () => {
            prevImage();
            stopAutoCycle();
        });

        favBtn.addEventListener('click', async () => {
            const currentImageFullUrl = imageUrls[currentIndex];

            const filename = currentImageFullUrl.split('/').pop();
            try {
                const response = await fetch('/favorite-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl: filename })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Image Marked as Favorite');
                    location.reload();
                } else {
                    console.error('Failed to mark image as favorite:', result.error || result);
                }
            } catch (err) {
                console.error('Error sending favorite request:', err);
            }
        });

        const delBtn = document.querySelector('#del01');

        delBtn.addEventListener('click', async () => {
            const currentImageFullUrl = imageUrls[currentIndex];
            const filename = currentImageFullUrl.split('/').pop();

            try {
                const response = await fetch('/delete-image', {
                    method: 'POST', // or DELETE if you're using that
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ imageUrl: filename })
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Image Deleted');
                    // Remove from imageUrls
                    imageUrls.splice(currentIndex, 1);

                    // If no images left
                    if (imageUrls.length === 0) {
                        midImg.src = '';
                        return;
                    }

                    // Show next image
                    if (currentIndex >= imageUrls.length) {
                        currentIndex = 0;
                    }
                    showImage(currentIndex);
                    location.reload();
                } else {
                    console.error('Failed to delete image:', result.error || result);
                }
            } catch (err) {
                console.error('Error sending delete request:', err);
            }
        });



    } catch (err) {
        console.error('Error fetching images:', err);
    }
});


//the right side unlock panel
document.addEventListener('DOMContentLoaded', async () => {
    const unlockDiv = document.querySelector('#unlock01');
    const leftBtn = document.querySelector('#left02');
    const rightBtn = document.querySelector('#right02');

    let imageUrls = [];
    let currentIndex = 0;

    try {
        const response = await fetch('/api/side-unlocked-images');
        const data = await response.json();

        imageUrls = data.imageUrls || [];
        const countDiv = document.querySelector('#count');
        countDiv.textContent = imageUrls.length;

        if (imageUrls.length === 0) {
            console.log('No unlocked images found');
            return;
        }

        // Show first image
        showImage(currentIndex);

        // Setup buttons
        leftBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
            showImage(currentIndex);
        });

        rightBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % imageUrls.length;
            showImage(currentIndex);
        });

    } catch (error) {
        console.error('Error loading unlocked images:', error);
    }

    const unlockBtn = document.querySelector('#unlock02');

    unlockBtn.addEventListener('click', async () => {
        if (imageUrls.length === 0) return;

        // Get current image filename from URL
        const currentImageUrl = imageUrls[currentIndex];
        const filename = currentImageUrl.split('/').pop();

        try {
            const response = await fetch('/api/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: filename }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Image unlocked successfully');
                // Optionally, remove image from slider or update UI
                imageUrls.splice(currentIndex, 1);

                if (imageUrls.length === 0) {
                    unlockDiv.style.backgroundImage = 'none';
                    alert('No more locked images!');
                    location.reload();
                    return;
                }

                if (currentIndex >= imageUrls.length) {
                    currentIndex = 0;
                }
                showImage(currentIndex);
                const countDiv = document.querySelector('#count');
                countDiv.textContent = imageUrls.length;
            } else {
                console.error('Failed to unlock image:', result.error || result);
            }
        } catch (err) {
            console.error('Error unlocking image:', err);
        }

    });


    function showImage(index) {
        unlockDiv.style.backgroundImage = `url("${imageUrls[index]}")`;
        unlockDiv.style.backgroundSize = 'cover';
        unlockDiv.style.backgroundRepeat = 'no-repeat';
        unlockDiv.style.backgroundPosition = 'center';
    }
});


//the rightside fav panel
document.addEventListener('DOMContentLoaded', async () => {
    const unlockDiv = document.querySelector('#fav02');
    const leftBtn = document.querySelector('#left03');
    const rightBtn = document.querySelector('#right03');

    let imageUrls = [];
    let currentIndex = 0;

    try {
        const response = await fetch('/api/favouriteRoute');
        const data = await response.json();

        imageUrls = data.imageUrls || [];

        if (imageUrls.length === 0) {
            console.log('No favorite images found');
            return;
        }

        // Show first image
        showImage(currentIndex);

        // Setup buttons
        leftBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
            showImage(currentIndex);
        });

        rightBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % imageUrls.length;
            showImage(currentIndex);
        });

    } catch (error) {
        console.error('Error loading favorite images:', error);
    }

    const unlockBtn = document.querySelector('#fav03');

    unlockBtn.addEventListener('click', async () => {
        if (imageUrls.length === 0) return;

        // Get current image filename from URL
        const currentImageUrl = imageUrls[currentIndex];
        const filename = currentImageUrl.split('/').pop();

        try {
            const response = await fetch('/api/unfavourite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: filename }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Image unfavorite successfully');
                // Optionally, remove image from slider or update UI
                imageUrls.splice(currentIndex, 1);

                if (imageUrls.length === 0) {
                    unlockDiv.style.backgroundImage = 'none';
                    alert('No more favorite images!');
                    return;
                }

                if (currentIndex >= imageUrls.length) {
                    currentIndex = 0;
                }
                showImage(currentIndex);
            } else {
                console.error('Failed to unfavorite image:', result.error || result);
            }
        } catch (err) {
            console.error('Error unfavoriting image:', err);
        }

    });


    function showImage(index) {
        unlockDiv.style.backgroundImage = `url("${imageUrls[index]}")`;
        unlockDiv.style.backgroundSize = 'cover';
        unlockDiv.style.backgroundRepeat = 'no-repeat';
        unlockDiv.style.backgroundPosition = 'center';
    }
});

