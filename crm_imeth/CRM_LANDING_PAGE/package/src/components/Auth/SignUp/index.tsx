"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SocialSignUp from "../SocialSignUp";
import Logo from "@/components/Layout/Header/Logo"
import { useState } from "react";
import Loader from "@/components/Common/Loader";
const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Validation functions
  const validateName = (name: string) => {
    if (!name.trim()) return "Name is required";
    if (!/^[a-zA-Z\s]{3,}$/.test(name)) return "Name must be at least 3 characters and contain only letters";
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password.trim()) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    setErrors((prev) => ({
      ...prev,
      [name]: name === "name"
        ? validateName(value)
        : name === "email"
          ? validateEmail(value)
          : validatePassword(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields before submitting
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    setErrors({ name: nameError, email: emailError, password: passwordError });
    if (nameError || emailError || passwordError) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      localStorage.setItem("user", JSON.stringify({ user: formData.name }));
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
              <div className="mb-10 text-center mx-auto inline-block max-w-[160px]">
                <Logo />
              </div>

              <SocialSignUp />

              <span className="z-1 relative my-8 block text-center">
                <span className="-z-1 absolute left-0 top-1/2 block h-px w-full bg-border dark:bg-dark_border"></span>
                <span className="text-sm text-midnight_text/40 dark:text-white/60  relative z-10 inline-block bg-white dark:bg-midnight_text dark:bg-dark_black px-3">
                  OR
                </span>
              </span>

              <form onSubmit={handleSubmit}>
                <div className="mb-[22px]">
                  <input
                    type="text"
                    placeholder="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="mb-[22px]">
                  <input
                    type="email"
                    placeholder="Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="mb-[22px]">
                  <input
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="mb-9">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-700"
                  >
                    Sign Up {loading && <Loader />}
                  </button>
                </div>
              </form>

              <p className="text-midnight_text dark:text-white">
                By creating an account you are agree with our{" "}
                <Link href="/#" className="text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary">
                  Privacy
                </Link>
                {" "}&{" "}
                <Link href="/#" className="text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary">
                  Policy
                </Link>
              </p>

              <p className="text-midnight_text dark:text-white">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-midnight_text dark:text-white hover:text-primary dark:hover:text-primary"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
