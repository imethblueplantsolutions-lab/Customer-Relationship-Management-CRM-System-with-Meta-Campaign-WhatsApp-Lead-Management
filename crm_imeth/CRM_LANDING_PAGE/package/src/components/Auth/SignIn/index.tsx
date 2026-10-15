"use client";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import SocialSignIn from "../SocialSignIn";
import Logo from "@/components/Layout/Header/Logo";
import Loader from "@/components/Common/Loader";

const Signin = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loginData, setLoginData] = useState({
        email: "",
        password: "",
    }); //login data state

    const [validationErrors, setValidationErrors] = useState({
        email: "",
        password: "",
    }); //validation state

    // Input validation function
    const validateForm = () => {
        let errors = { email: "", password: "" };
        let isValid = true;

        if (!loginData.email) {
            errors.email = "Email is required.";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
            errors.email = "Please enter a valid email address.";
            isValid = false;
        }

        if (!loginData.password) {
            errors.password = "Password is required.";
            isValid = false;
        } else if (loginData.password.length < 6) {
            errors.password = "Password must be at least 6 characters long.";
            isValid = false;
        }
        setValidationErrors(errors);
        return isValid;
    };

    // form handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            localStorage.setItem("user", JSON.stringify({ user: loginData.email }));
            router.push("/");
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center w-full dark:bg-darkmode pb-20">
            <div className="container">
                <div className="-mx-4 flex flex-wrap">
                    <div className="w-full px-4">
                        <div className="relative shadow-lg mx-auto max-w-lg overflow-hidden rounded-4xl bg-white dark:bg-midnight_text px-8 py-14 text-center sm:px-12 md:px-16">
                            <div className="mb-10 flex justify-center">
                                <Logo />
                            </div>

                            <SocialSignIn />

                            <span className="z-1 relative my-8 block text-center">
                                <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-border dark:bg-dark_border"></span>
                                <span className="text-sm text-midnight_text/40 dark:text-white/60  relative z-10 inline-block bg-white dark:bg-midnight_text dark:bg-dark_black px-3">
                                    OR
                                </span>
                            </span>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-5 text-left">
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        onChange={(e) =>
                                            setLoginData({ ...loginData, email: e.target.value })
                                        }
                                        className={`w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary`}
                                    />
                                    {validationErrors.email && (
                                        <p className="text-red-500 dark:text-red-500 text-sm mt-1">{validationErrors.email}</p>
                                    )}
                                </div>
                                <div className="mb-5 text-left">
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        onChange={(e) =>
                                            setLoginData({ ...loginData, password: e.target.value })
                                        }
                                        className={`w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary`}
                                    />
                                    {validationErrors.password && (
                                        <p className="text-red-500 dark:text-red-500 text-sm mt-1">{validationErrors.password}</p>
                                    )}
                                </div>
                                <div className="mb-9">
                                    <button
                                        type="submit"
                                        className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-700"
                                    >
                                        Sign In {loading && <Loader />}
                                    </button>
                                </div>
                            </form>

                            <Link
                                href="/forgot-password"
                                className="mb-2 inline-block text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary"
                            >
                                Forget Password?
                            </Link>
                            <p className="text-midnight_text dark:text-white">
                                Not a member yet?{" "}
                                <Link href="/signup" className="text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary">
                                    Sign Up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signin;
