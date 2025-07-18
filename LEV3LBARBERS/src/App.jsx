import './App.css'

import {BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Availability from './components/Availability';

function App() {
  return (
    <>
    <Header></Header>
    <Home></Home>
    <Availability></Availability>

    <Footer></Footer>
    </>
  )
}

export default App
