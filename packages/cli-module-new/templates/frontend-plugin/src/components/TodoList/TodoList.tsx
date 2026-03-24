import { Table, TableColumn, InfoCard } from '@backstage/core-components';

export type TodoItem = {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
};

const columns: TableColumn<TodoItem>[] = [
  { title: 'Title', field: 'title' },
  { title: 'Created by', field: 'createdBy' },
  {
    title: 'Created at',
    field: 'createdAt',
    render: row => new Date(row.createdAt).toLocaleString(),
  },
];

export const TodoList = ({ todos }: { todos: TodoItem[] }) => (
  <InfoCard title="Todo List">
    <Table
      options={{ search: false, paging: false }}
      columns={columns}
      data={todos}
    />
  </InfoCard>
);
