import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginUser } from "../api";


function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }


    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await loginUser(formData);

            navigate(`/profile/${response.user_id}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div>
            <h1>Iniciar sesión</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">
                        Correo electrónico
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Contraseña
                    </label>

                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {error && (
                    <p>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading
                        ? "Iniciando sesión..."
                        : "Iniciar sesión"}
                </button>
            </form>

            <p>
                ¿No tienes una cuenta?
            </p>

            <button
                type="button"
                onClick={() => navigate("/register")}
            >
                Registrarse
            </button>
        </div>
    );
}


export default Login;