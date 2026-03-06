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
    const goalsGrid = document.querySelector('.goals-grid');


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

    /* =====================================================
       КНОПКА "ВИКОНАНО" + map / filter
    ===================================================== */

    function attachCompleteButton(card, index) {
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
    }

    goalCards.forEach((card, index) => {
        attachCompleteButton(card, index);
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
        const deadline = document.getElementById('goal-deadline').value;
        const imageUrl = document.getElementById('goal-image').value.trim();
        const stepsRaw = document.getElementById('goal-steps').value;
        const motivation = document.getElementById('goal-motivation').value.trim();

        if (title === '') {
            alert('❌ Назва цілі не може бути порожньою');
            return;
        }

        const steps = stepsRaw
            .split('\n')
            .map(step => step.trim())
            .filter(step => step !== '');

        if (steps.length === 0) {
            alert('❌ Додайте хоча б один крок (кожен з нового рядка)');
            return;
        }

        goals.push({ title, completed: false });

        const newCard = document.createElement('article');
        newCard.className = 'goal-card';

        if (goals.length % 2 !== 0) {
            newCard.style.backgroundColor = '#f9f9ff';
        } else {
            newCard.style.backgroundColor = '#ffffff';
        }

        const image = document.createElement('img');
        image.src = imageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600';
        image.alt = title;

        const heading = document.createElement('h3');
        heading.textContent = `🎯 ${title}`;

        const deadlineParagraph = document.createElement('p');
        deadlineParagraph.innerHTML = `<strong>Дедлайн:</strong> ${deadline || 'Не вказано'}`;

        const checklist = document.createElement('ul');
        checklist.className = 'goal-checklist';

        steps.forEach((step) => {
            const listItem = document.createElement('li');
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';

            label.appendChild(checkbox);
            label.append(` ${step}`);
            listItem.appendChild(label);
            checklist.appendChild(listItem);
        });

        const motivationParagraph = document.createElement('p');
        motivationParagraph.className = 'goal-motivation';
        motivationParagraph.innerHTML = `<strong>Мотивація:</strong> ${motivation || 'Немає'}`;

        newCard.appendChild(image);
        newCard.appendChild(heading);
        newCard.appendChild(deadlineParagraph);
        newCard.appendChild(checklist);
        newCard.appendChild(motivationParagraph);

        goalsGrid.appendChild(newCard);
        attachCompleteButton(newCard, goals.length - 1);

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