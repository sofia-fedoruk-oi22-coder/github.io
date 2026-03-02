export default function GoalFilter({ value, onChange }) {
  return (
    <div className="filter-box">
      <label htmlFor="goal-status-filter">Фільтр за статусом: </label>
      <select
        id="goal-status-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="all">Усі</option>
        <option value="active">Активні</option>
        <option value="completed">Завершені</option>
        <option value="deferred">Відкладені</option>
      </select>
    </div>
  );
}
