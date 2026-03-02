export default function CommunityComments({ comments }) {
  return (
    <section id="community">
      <h2>Спільнота</h2>
      {comments.map((item) => (
        <article className="comment" key={item.id}>
          <h4>{item.author}</h4>
          <p>{item.text}</p>
        </article>
      ))}
    </section>
  );
}
