"use client";
import Loader from "@/components/Common/Loader";
import Logo from "@/components/Layout/Header/Logo";
import React, { useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loader, setLoader] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Function to validate email
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required.");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Invalid email format.");
      return false;
    }
    const domain = value.split("@")[1];
    setEmailError(""); // Clear error if valid
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoader(true);
    setTimeout(() => {
      setLoader(false);
      setIsEmailSent(true);
    }, 2000);
  };

  return (
    <section>
      <div className="relative w-full pb-16 sm:pb-28 flex items-center justify-center dark:bg-darkmode">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="relative shadow-lg mx-auto max-w-lg overflow-hidden rounded-4xl dark:bg-midnight_text px-8 py-14 text-center dark:bg-dark-2 sm:px-12 md:px-16">
                <div className="mb-10 flex justify-center">
                  <Logo />
                </div>

                {isEmailSent ? (
                  <div className="flex flex-col items-center gap-2">
                    <h5 className="text-secondary dark:text-white font-bold">
                      Forgot Your Password?
                    </h5>
                    <p className="text-secondary/60 dark:text-white/60">
                      Please check your inbox for the new password.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="mb-5 text-left">
                      <input
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          validateEmail(e.target.value);
                        }}
                        required
                        className="w-full rounded-lg border border-border dark:border-dark_border border-solid bg-transparent px-5 py-3 text-base text-dark outline-hidden transition placeholder:text-grey focus:border-primary focus-visible:shadow-none dark:text-white dark:focus:border-primary"
                      />
                      {emailError && (
                        <p className="text-red-500 text-sm mt-1">{emailError}</p>
                      )}
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-700"
                        disabled={loader}
                      >
                        {loader ? <Loader /> : "Send Email"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
