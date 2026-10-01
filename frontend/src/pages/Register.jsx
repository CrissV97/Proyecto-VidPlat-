import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registerUser } from "../api";


function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
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
            await registerUser(formData);

            navigate("/login");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <div>
            <h1>Crear cuenta</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">
                        Nombre
                    </label>

                    <input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

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
                        ? "Creando cuenta..."
                        : "Crear cuenta"}
                </button>
            </form>

            <p>
                ¿Ya tienes una cuenta?
            </p>

            <button
                type="button"
                onClick={() => navigate("/login")}
            >
                Iniciar sesión
            </button>
        </div>
    );
}


export default Register;