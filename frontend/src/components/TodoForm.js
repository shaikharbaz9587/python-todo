import React, { useState } from 'react';

function TodoForm({ fetchTodos }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    console.log('Creating todo with token:', token);  // Debug log
    try {
      const response = await fetch('http://localhost:5000/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error('Failed to create todo');
      const data = await response.json();
      console.log('Todo created:', data);  // Debug log
      setTitle('');
      fetchTodos();
    } catch (error) {
      console.error('Error creating todo:', error);
      setError(error.message);
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Add Todo</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter todo title"
          className="w-full p-2 border rounded mb-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Todo
        </button>
      </form>
    </div>
  );
}

export default TodoForm;