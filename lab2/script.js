document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================
       ДАНІ (МАСИВ ЦІЛЕЙ)
    ===================================================== */

    let goals = [
        { title: 'Вивчити Java', completed: false },
        { title: 'Повернутися до танців', completed: false },
        { title: 'Робота за кордоном', completed: false }
    ];


    /* =====================================================
       ВИДІЛЕННЯ ЕЛЕМЕНТІВ
    ===================================================== */

    const goalCards = document.querySelectorAll('.goal-card');
    const progressText = document.getElementById('progress-text');
    const toggleCommunityBtn = document.getElementById('toggle-community');
    const communitySection = document.getElementById('community');
    const form = document.querySelector('.goal-form');


    /* =====================================================
       ЗАВДАННЯ 1 — DOM + ЦИКЛИ + УМОВИ
    ===================================================== */

    // FOR + IF / ELSE
    for (let i = 0; i < goalCards.length; i++) {
        if (i % 2 === 0) {
            goalCards[i].style.backgroundColor = '#f9f9ff';
        } else {
            goalCards[i].style.backgroundColor = '#ffffff';
        }
    }

    // forEach + querySelectorAll
    goalCards.forEach((card, index) => {
        const title = card.querySelector('h3');
        title.textContent = `${index + 1}. ${title.textContent}`;
    });


    /* =====================================================
       КНОПКА "ВИКОНАНО" + map / filter
    ===================================================== */

    goalCards.forEach((card, index) => {
        const btn = document.createElement('button');
        btn.textContent = 'Виконано';
        btn.className = 'btn-submit';
        btn.style.marginTop = '15px';

        btn.addEventListener('click', () => {
            goals[index].completed = !goals[index].completed;

            card.style.opacity = goals[index].completed ? '0.6' : '1';

            updateProgress();
        });

        card.appendChild(btn);
    });


    /* =====================================================
       ПРОГРЕС + ТЕРНАРНИЙ ОПЕРАТОР
    ===================================================== */

    function updateProgress() {
        const completedGoals = goals.filter(goal => goal.completed);
        const percent = Math.round((completedGoals.length / goals.length) * 100);

        progressText.textContent =
            percent === 100
                ? '🎉 Усі цілі виконані!'
                : `📊 Виконано ${percent}% цілей`;
    }

    updateProgress();


    /* =====================================================
       ЗАВДАННЯ 2 — ОБРОБКА ПОДІЙ
    ===================================================== */

    // КНОПКА ПОКАЗАТИ / СХОВАТИ
    toggleCommunityBtn.addEventListener('click', () => {
        if (communitySection.style.display === 'none') {
            communitySection.style.display = 'block';
        } else {
            communitySection.style.display = 'none';
        }
    });

    // НАВЕДЕННЯ (hover)
    const navLinks = document.querySelectorAll('nav a');

    for (let i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener('mouseenter', () => {
            navLinks[i].style.color = '#6c63ff';
        });

        navLinks[i].addEventListener('mouseleave', () => {
            navLinks[i].style.color = '';
        });
    }


    /* =====================================================
       ЗАВДАННЯ 3 — ОБРОБКА ФОРМИ
    ===================================================== */

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const title = document.getElementById('goal-title').value.trim();

        if (title === '') {
            alert('❌ Назва цілі не може бути порожньою');
            return;
        }

        goals.push({ title, completed: false });
        alert('✅ Ціль додано!');

        form.reset();
        updateProgress();
    });


    /* =====================================================
       WHILE — МОТИВАЦІЙНИЙ ТАЙМЕР
    ===================================================== */

    let seconds = 10;

    const timer = setInterval(() => {
        if (seconds > 0) {
            console.log(`⏰ Не забувай про свої цілі! (${seconds})`);
            seconds--;
        } else {
            alert('🔥 Час зробити хоча б один крок до цілі!');
            clearInterval(timer);
        }
    }, 1000);

});