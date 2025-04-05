import React, { useState } from "react";

import CountdownTimer from "@/components/countdown";
import ParticleAttractorSystem from "../components/ThreeJSScene";
import ServlyIcon from "../../public/images/Icon White.png";
import ServlyWordmark from "../../public/images/Wordmark White.png";
import SignupForm from "../components/signUpForm";
import SocialLinks from "../components/socialLinks";
import axios from "axios";
import { message } from "antd";
import { Link } from "react-router-dom";

const ComingSoonPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailUrl = import.meta.env.VITE_SERVLY_EMAIL_API;
  const [messageApi, contextHolder] = message.useMessage();
  const key = "updatable";

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); ''

    setIsSubmitting(true);

    // Make API request with axios
    const headers = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    axios
      .post(emailUrl, formData, { headers, withCredentials: false })
      .then(() => {

        setIsSubmitted(true);
        setFormData({ name: "", email: "" });

        messageApi.open({
          key,
          type: "success",
          content: "Saved. Thank you!",
          duration: 3,
        });

      })
      .catch((error) => {
        setIsSubmitting(false);
        messageApi.open({
          key,
          type: "error",
          content: "Issue submitting",
          duration: 2,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div
      className="flex h-screen flex-row items-center justify-center overflow-hidden 
        bg-[#09090B] text-white"
    >
      {contextHolder}

      {/* Content overlay */}
      <div
        className="absolute z-10 flex w-full max-w-xs flex-col items-center justify-center rounded-3xl 
            border-[2px] border-[#272727] bg-[#131214]/60 p-8 px-8 shadow-[0_8px_16px_rgba(255,255,255,0.03)] 
            backdrop-blur-md"
      >
        <div className=" flex w-full flex-col items-center justify-center gap-8">
          {/* <Logo /> */}
          <div className="flex flex-col gap-2">
            <img className="h-[23px] object-contain" src={ServlyIcon} alt="X" />
            <img className="h-[20px]" src={ServlyWordmark} alt="Servly" />
          </div>

          {/* Heading */}
          {!isSubmitted && (
            <div
              className="labeltop mb-5  flex justify-center gap-3 text-center font-serif text-xl font-medium"
            // style={{ fontFamily: "Helius" }}
            >
              Join Internal Beta Programme
            </div>
          )}
        </div>

        {isSubmitted ? (
          <CountdownTimer />
        ) : (
          <SignupForm
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Social links */}
        {isSubmitted && (
          <div>
            <SocialLinks />
          </div>
        )}

        {/* extra */}
        <div className="flex gap-2 mt-4 z-10 flex w-full max-w-xs flex-row items-center justify-center rounded-3xl p-1 px-8">
          <Link to="/legal/terms" className="hover:text-blue-500 transition-colors text-xs">Terms</Link>•
          <Link to="/legal/privacy" className="hover:text-blue-500 transition-colors text-xs">Privacy</Link>•
          <Link to="/legal/pricing" className="hover:text-blue-500 transition-colors text-xs">Pricing</Link>•
          <Link to="/legal/refund" className="hover:text-blue-500 transition-colors text-xs">Refunds</Link>
        </div>
      </div>



      {/* 3D model container */}
      <div className="h-[100vh] w-[100vw]">
        <ParticleAttractorSystem isSubmitting={isSubmitting} />
      </div>


      {/* Custom style */}
      <style>
        {`
                .labeltop {
                font-family: "Instrument Serif", serif;
                }
                `}
      </style>

    </div>
  );
};

export default ComingSoonPage;
