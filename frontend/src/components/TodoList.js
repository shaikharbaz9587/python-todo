import React, { useState } from 'react';
const API_BASE_URL = process.env.REACT_APP_API_URL;
function TodoList({ todos, fetchTodos }) {
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleToggle = async (id, completed) => {
    await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ completed: !completed }),
    });
    fetchTodos();
  };

  const handleDelete = async (id) => {
    await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    fetchTodos();
  };

  const handleEdit = (id, title) => {
    setEditId(id);
    setEditTitle(title);
  };

  const handleSave = async (id) => {
    await fetch(`http://localhost:5000/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ title: editTitle }),
    });
    setEditId(null);
    setEditTitle('');
    fetchTodos();
  };

  const handleCancel = () => {
    setEditId(null);
    setEditTitle('');
  };

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <li key={todo.id} className="flex justify-between items-center p-2 border-b">
          {editId === todo.id ? (
            <div className="w-full flex space-x-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full p-1 border rounded"
                autoFocus
              />
              <button
                onClick={() => handleSave(todo.id)}
                className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <span
              className={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}
              onClick={() => handleToggle(todo.id, todo.completed)}
            >
              {todo.title}
            </span>
          )}
          {editId !== todo.id && (
            <>
              <button
                onClick={() => handleEdit(todo.id, todo.title)}
                className="text-yellow-500 hover:text-yellow-700 mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default TodoList;