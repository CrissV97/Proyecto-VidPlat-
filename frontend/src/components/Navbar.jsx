import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    getToken,
    getUserId,
    logoutUser
} from "../services/api";


function Navbar() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");

    const isLoggedIn = Boolean(getToken());
    const userId = getUserId();


    function handleSearch(event) {
        event.preventDefault();

        const searchValue = search.trim();

        if (!searchValue) {
            return;
        }

        navigate(
            `/?search=${encodeURIComponent(searchValue)}`
        );
    }


    function handleLogout() {
        logoutUser();
        navigate("/");
    }


    return (
        <nav className="navbar">

            {/* =========================================
                LOGO
            ========================================= */}

            <Link
                to="/"
                className="navbar-logo"
            >
                VidPlat
            </Link>


            {/* =========================================
                BUSCADOR
            ========================================= */}

            <form
                className="navbar-search"
                onSubmit={handleSearch}
            >
                <input
                    type="text"
                    placeholder="Buscar videos..."
                    value={search}
                    onChange={(event) =>
                        setSearch(
                            event.target.value
                        )
                    }
                />

                <button type="submit">
                    Buscar
                </button>
            </form>


            {/* =========================================
                ACCIONES
            ========================================= */}

            <div className="navbar-actions">

                {isLoggedIn ? (
                    <>
                        <Link
                            to={`/profile/${userId}`}
                        >
                            Mi perfil
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Cerrar sesión
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            Iniciar sesión
                        </Link>

                        <Link
                            to="/register"
                            className="register-button"
                        >
                            Registrarse
                        </Link>
                    </>
                )}

            </div>

        </nav>
    );
}


export default Navbar;