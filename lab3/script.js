document.addEventListener('DOMContentLoaded', function () {
	const byId = function (id) {
		return document.getElementById(id);
	};

	const toggleButton = byId('toggle-community');
	const communitySection = byId('community');
	const outputArea = byId('menu-output');
	const navLinks = document.querySelectorAll('nav a');
	const goalsContainer = byId('goals-container');
	const goalsProgressText = byId('progress-goals-summary');
	const goalsPlannedText = byId('progress-goals-planned');
	const dailyTimerText = byId('daily-timer-text');
	const dailyMotivationText = byId('daily-motivation-text');
	const addGoalForm = byId('add-goal-form');
	const goalTitleInput = byId('goal-title');
	const goalDeadlineInput = byId('goal-deadline');
	const goalDeadlineYearInput = byId('goal-deadline-year');
	const goalImageInput = byId('goal-image-url');
	const goalStepsInput = byId('goal-steps');
	const goalMotivationInput = byId('goal-motivation');

	const setOutput = function (text) {
		if (outputArea) {
			outputArea.textContent = text;
		}
	};

	let goalsList = [
		{
			id: 1,
			image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
			alt: 'Навчання програмуванню',
			title: '📘 Вивчити Java',
			deadline: { mode: 'date', value: '2026-06-30' },
			steps: ['Основи', 'ООП', 'JavaFX'],
			motivation: 'Ця ціль відкриває шлях до першої роботи в ІТ.',
			completed: false
		},
		{
			id: 2,
			image: 'https://wintergardens.dance/wp-content/uploads/2024/01/IMG_7268-scaled-e1704531371990.jpg',
			alt: 'Танцювальні тренування',
			title: '💃 Повернутися до танців',
			deadline: { mode: 'date', value: '2026-05-01' },
			steps: ['Запис у студію', 'Регулярні тренування', 'Виступ'],
			motivation: 'Танці допомагають тримати енергію, форму й внутрішній баланс.',
			completed: false
		},
		{
			id: 3,
			image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600',
			alt: 'Міжнародна карʼєра',
			title: '🌍 Робота за кордоном',
			deadline: { mode: 'year', value: 2027 },
			steps: ['Англійська', 'Портфоліо', 'Співбесіди'],
			motivation: 'Це крок до фінансової стабільності та міжнародного досвіду.',
			completed: false
		}
	];

	const monthNames = [
		'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
		'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
	];

	function normalizeSteps(steps) {
		return steps.map(function (step) {
			if (typeof step === 'string') {
				return {
					text: step,
					done: false
				};
			}

			return {
				text: step.text,
				done: Boolean(step.done)
			};
		});
	}

	function normalizeDeadline(deadline) {
		if (typeof deadline === 'object' && deadline !== null && deadline.mode) {
			return deadline;
		}

		if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
			return { mode: 'date', value: deadline };
		}

		if (typeof deadline === 'string' && /^\d{4}$/.test(deadline)) {
			return { mode: 'year', value: Number(deadline) };
		}

		return { mode: 'year', value: new Date().getFullYear() };
	}

	function formatDeadline(deadline) {
		const normalized = normalizeDeadline(deadline);

		if (normalized.mode === 'year') {
			return String(normalized.value);
		}

		const parts = String(normalized.value).split('-');
		if (parts.length !== 3) {
			return String(normalized.value);
		}

		const year = parts[0];
		const monthIndex = Number(parts[1]) - 1;
		const day = String(parts[2]).padStart(2, '0');
		const monthName = monthNames[monthIndex] || parts[1];

		return `${day} ${monthName} ${year}`;
	}

	goalsList = goalsList.map(function (goal) {
		const normalizedSteps = normalizeSteps(goal.steps);
		const completedBySteps = normalizedSteps.length > 0 && normalizedSteps.every(function (step) {
			return step.done;
		});

		return {
			...goal,
			deadline: normalizeDeadline(goal.deadline),
			steps: normalizedSteps,
			completed: goal.completed || completedBySteps
		};
	});

	if (toggleButton && communitySection) {
		toggleButton.addEventListener('click', function () {
			if (communitySection.style.display === 'none') {
				communitySection.style.display = 'block';
				toggleButton.textContent = 'Приховати секцію "Спільнота"';
				setOutput('Секцію "Спільнота" знову показано.');
			} else {
				communitySection.style.display = 'none';
				toggleButton.textContent = 'Показати секцію "Спільнота"';
				setOutput('Секцію "Спільнота" приховано.');
			}
		});
	}

	for (let index = 0; index < navLinks.length; index++) {
		const link = navLinks[index];

		link.addEventListener('click', function () {
			for (let clearIndex = 0; clearIndex < navLinks.length; clearIndex++) {
				navLinks[clearIndex].classList.remove('menu-active');
			}

			link.classList.add('menu-active');

			if (index === 0) {
				setOutput('Розділ "Мої цілі": перегляд ваших головних цілей та чеклистів.');
			} else if (index === 1) {
				setOutput('Розділ "Додати ціль": створіть нову ціль із дедлайном і кроками.');
			} else if (index === 2) {
				setOutput('Розділ "Прогрес": перегляньте ваш поточний стан досягнень.');
			} else {
				setOutput('Розділ "Спільнота": мотиваційні коментарі та підтримка.');
			}
		});

		link.addEventListener('mouseenter', function () {
			if (link.classList.contains('menu-active')) {
				link.style.backgroundColor = '#5a6bc4';
			} else {
				link.style.backgroundColor = '#4a5ec0';
			}

			setOutput(`Наведено на меню: ${link.textContent}`);
		});

		link.addEventListener('mouseleave', function () {
			if (link.classList.contains('menu-active')) {
				link.style.backgroundColor = '#4a5ec0';
			} else {
				link.style.backgroundColor = 'transparent';
			}

			if (outputArea && !link.classList.contains('menu-active')) {
				setOutput('Натисніть пункт меню, щоб побачити його опис.');
			}
		});
	}

	const refreshGoals = function () {
		renderGoals();
		updateGoalsProgress();
	};

	function updateGoalsProgress() {
		const completedGoals = goalsList.filter(function (goal) {
			return goal.completed;
		});

		const plannedGoals = goalsList.filter(function (goal) {
			return !goal.completed;
		});

		const total = goalsList.length;
		const completedCount = completedGoals.length;
		const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

		if (goalsProgressText) {
			goalsProgressText.textContent = `🏆 Виконано ${completedCount} з ${total} цілей (${percent}%).`;
		}

		if (goalsPlannedText) {
			goalsPlannedText.textContent = `📌 Запланованих цілей: ${plannedGoals.length}.`;
		}
	}

	function renderGoals() {
		if (!goalsContainer) {
			return;
		}

		goalsContainer.innerHTML = '';

		for (let index = 0; index < goalsList.length; index++) {
			const goal = goalsList[index];

			const card = document.createElement('article');
			card.className = 'goal-card';
			if (goal.completed) {
				card.classList.add('goal-completed');
			}

			const image = document.createElement('img');
			image.src = goal.image;
			image.alt = goal.alt;

			const title = document.createElement('h3');
			title.textContent = goal.title;

			const deadline = document.createElement('p');
			deadline.innerHTML = `<strong>Дедлайн:</strong> ${formatDeadline(goal.deadline)}`;

			const checklist = document.createElement('ul');
			checklist.className = 'goal-checklist';

			for (let stepIndex = 0; stepIndex < goal.steps.length; stepIndex++) {
				const stepValue = goal.steps[stepIndex];
				const stepText = stepValue.text;
				const stepDone = stepValue.done;

				const checklistItem = document.createElement('li');
				const checklistLabel = document.createElement('label');
				const stepCheckbox = document.createElement('input');
				stepCheckbox.type = 'checkbox';
				stepCheckbox.checked = stepDone;

				const stepTextNode = document.createElement('span');
				stepTextNode.textContent = stepText;

				stepCheckbox.addEventListener('change', function () {
					goalsList = goalsList.map(function (innerGoal) {
						if (innerGoal.id !== goal.id) {
							return innerGoal;
						}

						const updatedSteps = innerGoal.steps.map(function (innerStep, innerStepIndex) {
							if (innerStepIndex === stepIndex) {
								return {
									text: innerStep.text,
									done: stepCheckbox.checked
								};
							}

							return innerStep;
						});

						const completedBySteps = updatedSteps.length > 0 && updatedSteps.every(function (innerStep) {
							return innerStep.done;
						});

						return {
							...innerGoal,
							steps: updatedSteps,
							completed: completedBySteps
						};
					});

					refreshGoals();
				});

				checklistLabel.appendChild(stepCheckbox);
				checklistLabel.appendChild(stepTextNode);
				checklistItem.appendChild(checklistLabel);
				checklist.appendChild(checklistItem);
			}

			const motivation = document.createElement('p');
			motivation.className = 'goal-motivation';
			motivation.innerHTML = `<strong>Мотивація:</strong> ${goal.motivation}`;

			const actionBox = document.createElement('div');
			actionBox.className = 'goal-actions';

			const completeButton = document.createElement('button');
			completeButton.type = 'button';
			completeButton.className = 'goal-complete-btn';
			if (goal.completed) {
				completeButton.classList.add('done');
				completeButton.textContent = 'Скасувати виконання';
			} else {
				completeButton.textContent = 'Виконано';
			}

			completeButton.addEventListener('click', function () {
				goalsList = goalsList.map(function (innerGoal) {
					if (innerGoal.id === goal.id) {
						const nextCompletedState = !innerGoal.completed;
						const updatedSteps = innerGoal.steps.map(function (innerStep) {
							return {
								text: innerStep.text,
								done: nextCompletedState
							};
						});

						return {
							...innerGoal,
							steps: updatedSteps,
							completed: nextCompletedState
						};
					}

					return innerGoal;
				});

				refreshGoals();
			});

			actionBox.appendChild(completeButton);
			card.appendChild(image);
			card.appendChild(title);
			card.appendChild(deadline);
			card.appendChild(checklist);
			card.appendChild(motivation);
			card.appendChild(actionBox);
			goalsContainer.appendChild(card);
		}
	}

	refreshGoals();

	if (addGoalForm && goalTitleInput && goalDeadlineInput && goalStepsInput && goalMotivationInput) {
		addGoalForm.addEventListener('submit', function (event) {
			event.preventDefault();

			const titleValue = goalTitleInput.value.trim();
			const deadlineDateValue = goalDeadlineInput.value.trim();
			const deadlineYearValue = goalDeadlineYearInput ? goalDeadlineYearInput.value.trim() : '';
			const imageValue = goalImageInput ? goalImageInput.value.trim() : '';
			const stepsValue = goalStepsInput.value.trim();
			const motivationValue = goalMotivationInput.value.trim();
			const hasValidYear = /^\d{4}$/.test(deadlineYearValue);

			let deadlineValue;
			if (deadlineDateValue !== '') {
				deadlineValue = { mode: 'date', value: deadlineDateValue };
			} else if (hasValidYear) {
				deadlineValue = { mode: 'year', value: Number(deadlineYearValue) };
			} else {
				deadlineValue = null;
			}

			if (titleValue === '' || !deadlineValue || stepsValue === '') {
				return;
			}

			const parsedSteps = stepsValue
				.split(/[\n,]+/)
				.map(function (step) {
					return step.trim();
				})
				.filter(function (step) {
					return step !== '';
				});

			const newGoal = {
				id: Date.now(),
				image: imageValue !== '' ? imageValue : 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600',
				alt: titleValue,
				title: titleValue,
				deadline: deadlineValue,
				steps: normalizeSteps(parsedSteps.length > 0 ? parsedSteps : ['Новий крок']),
				motivation: motivationValue !== '' ? motivationValue : 'Рухайся вперед щодня, навіть маленькими кроками.',
				completed: false
			};

			goalsList = [...goalsList, newGoal];
			refreshGoals();
			addGoalForm.reset();
		});
	}

	function getNextReminderTime() {
		const now = new Date();
		const nextReminder = new Date(now);
		nextReminder.setHours(20, 0, 0, 0);

		if (nextReminder <= now) {
			nextReminder.setDate(nextReminder.getDate() + 1);
		}

		return nextReminder;
	}

	let nextReminderTime = getNextReminderTime();

	function formatTime(milliseconds) {
		const totalSeconds = Math.floor(milliseconds / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}

	function updateDailyTimer() {
		const now = new Date();
		const difference = nextReminderTime - now;
		const plannedGoals = goalsList.filter(function (goal) {
			return !goal.completed;
		});

		if (difference <= 0) {
			nextReminderTime = getNextReminderTime();
			if (dailyMotivationText) {
				dailyMotivationText.textContent = `Нагадування: у вас ${plannedGoals.length} запланованих завдань. Зробіть хоча б один крок сьогодні 🚀`;
			}
		}

		if (dailyTimerText) {
			dailyTimerText.textContent = `Наступне нагадування через: ${formatTime(nextReminderTime - new Date())}`;
		}
	}

	updateDailyTimer();
	setInterval(updateDailyTimer, 1000);

	const feedbackForm = byId('feedback-form');
	const nameInput = byId('user-name');
	const commentInput = byId('user-comment');
	const formStatus = byId('form-status');
	const communityCommentsContainer = byId('community');

	if (feedbackForm && nameInput && commentInput && formStatus && communityCommentsContainer) {
		feedbackForm.addEventListener('submit', function (event) {
			event.preventDefault();

			const userName = nameInput.value.trim();
			const userComment = commentInput.value.trim();

			if (userName === '' || userComment === '') {
				formStatus.textContent = 'Будь ласка, заповніть ім’я та коментар.';
				formStatus.style.color = '#c62828';
			} else {
				formStatus.textContent = 'Коментар додано у секцію "Спільнота"!';
				formStatus.style.color = '#2f3b84';

				const communityItem = document.createElement('article');
				communityItem.className = 'comment';

				const communityTitle = document.createElement('h4');
				communityTitle.textContent = userName;
				const communityComment = document.createElement('p');
				communityComment.textContent = userComment;

				communityItem.appendChild(communityTitle);
				communityItem.appendChild(communityComment);

				communityCommentsContainer.appendChild(communityItem);

				feedbackForm.reset();
			}
		});
	}
});
