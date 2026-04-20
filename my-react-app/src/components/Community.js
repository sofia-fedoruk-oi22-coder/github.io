import React from 'react';

function Community() {
  const comments = [
    { id: 1, name: 'Оксана', text: 'Маленькі кроки щодня дають великі результати.' },
    { id: 2, name: 'Андрій', text: 'Цілі допомогли мені змінити підхід до життя.' },
    { id: 3, name: 'Марина', text: 'Найкраще працює система маленьких, але щоденних дій.' },
  ];

  return (
    <div>
      {comments.map((comment) => (
        <article className="comment" key={comment.id}>
          <h4>{comment.name}</h4>
          <p>{comment.text}</p>
        </article>
      ))}
    </div>
  );
}

export default Community;