import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (!email.trim() || !password) {
            setError(
                "El correo y la contraseña son obligatorios."
            );
            return;
        }

        try {
            setLoading(true);

            await loginUser({
                email: email.trim(),
                password
            });

            navigate("/");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">

            <section className="auth-card">

                <div className="auth-brand">
                    <Link to="/">
                        VidPlat
                    </Link>
                </div>

                <div className="auth-header">

                    <h1>
                        Iniciar sesión
                    </h1>

                    <p>
                        Ingresa a tu cuenta para continuar
                        disfrutando de VidPlat.
                    </p>

                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label htmlFor="login-email">
                            Correo electrónico
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="ejemplo@correo.com"
                            autoComplete="email"
                        />

                    </div>

                    <div className="form-group">

                        <label htmlFor="login-password">
                            Contraseña
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Ingresa tu contraseña"
                            autoComplete="current-password"
                        />

                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Iniciando sesión..."
                            : "Iniciar sesión"}
                    </button>

                </form>

                <div className="auth-footer">

                    <span>
                        ¿No tienes una cuenta?
                    </span>

                    <Link to="/register">
                        Registrarse
                    </Link>

                </div>

            </section>

        </main>
    );
}

export default Login;