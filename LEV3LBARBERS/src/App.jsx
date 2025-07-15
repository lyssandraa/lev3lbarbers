import './App.css'

import {BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';

function App() {
  return (
    <>
    <Header></Header>
    <Home></Home>

    <Footer></Footer>
    </>
  )
}

export default App
