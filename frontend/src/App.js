// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;



// import React, { useState, useEffect } from 'react';
// import TodoList from './components/TodoList';
// import TodoForm from './components/TodoForm';
// import Login from './components/Login';
// import Register from './components/Register';

// function App() {
//   const [todos, setTodos] = useState([]);
//   const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

//   const fetchTodos = async () => {
//     if (!isAuthenticated) return;
//     const response = await fetch('http://localhost:5000/api/todos', {
//       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//     });
//     const data = await response.json();
//     setTodos(data);
//   };

//   useEffect(() => {
//     if (isAuthenticated) fetchTodos();
//   }, [isAuthenticated]);

//   const handleLogin = (token) => {
//     localStorage.setItem('token', token);
//     setIsAuthenticated(true);
//   };

//   const handleLogout = async () => {
//     await fetch('http://localhost:5000/api/logout', {
//       method: 'POST',
//       headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//     });
//     localStorage.removeItem('token');
//     setIsAuthenticated(false);
//     setTodos([]);
//   };

//   const completedCount = todos.filter(todo => todo.completed).length;
//   const pendingCount = todos.filter(todo => !todo.completed).length;

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//       <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-4 text-center">To-Do List</h1>
//         {!isAuthenticated ? (
//           <>
//             <Register onRegister={handleLogin} />
//             <Login onLogin={handleLogin} />
//           </>
//         ) : (
//           <>
//             <TodoForm fetchTodos={fetchTodos} />
//             <div className="mb-4 text-sm text-gray-600">
//               Completed: {completedCount} | Pending: {pendingCount}
//             </div>
//             <TodoList todos={todos} fetchTodos={fetchTodos} />
//             <button
//               onClick={handleLogout}
//               className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-4"
//             >
//               Logout
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [todos, setTodos] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const fetchTodos = async () => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('token');
    console.log('Fetching todos with token:', token);  // Debug log
    try {
      const response = await fetch('http://localhost:5000/api/todos', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchTodos();

    // Handle Google callback redirect
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      console.log('Token received from callback:', token);  // Debug log
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
      window.history.replaceState({}, document.title, '/');
      fetchTodos();
    }
  }, [isAuthenticated]);

  const handleLogin = (token) => {
    console.log('Login token received:', token);  // Debug log
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    fetchTodos();
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/google/login';
  };

  const handleLogout = async () => {
    await fetch('http://localhost:5000/api/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    });
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setTodos([]);
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.filter(todo => !todo.completed).length;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">To-Do List</h1>
        {!isAuthenticated ? (
          <>
            <Register onRegister={handleLogin} />
            <Login onLogin={handleLogin} />
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-4"
            >
              Login with Google
            </button>
          </>
        ) : (
          <>
            <TodoForm fetchTodos={fetchTodos} />
            <div className="mb-4 text-sm text-gray-600">
              Completed: {completedCount} | Pending: {pendingCount}
            </div>
            <TodoList todos={todos} fetchTodos={fetchTodos} />
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-4"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;