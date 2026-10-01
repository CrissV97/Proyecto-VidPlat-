import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VideoPlayer from "./pages/VideoPlayer";
import Profile from "./pages/Profile";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/video/:id" element={<VideoPlayer />} />
                <Route path="/profile/:id" element={<Profile />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;