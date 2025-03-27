import React, { useState } from 'react';
import SignupForm from '../components/signUpForm';
import SocialLinks from '../components/socialLinks';
import ParticleAttractorSystem from '../components/ThreeJSScene';
import ServlyIcon from '../../public/images/Icon White.png';
import ServlyWordmark from '../../public/images/Wordmark White.png';
import axios from 'axios';
import { message } from 'antd';
import CountdownTimer from '@/components/countdown';
import { Slide, Bounce, JackInTheBox } from "react-awesome-reveal";

const ComingSoonPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const emailUrl = import.meta.env.VITE_SERVLY_EMAIL_API
    const [messageApi, contextHolder] = message.useMessage();
    const key = 'updatable';

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log('Submitted:', formData);
        // Here you would typically send this data to your backend
        // alert('Thank you for your interest! We will notify you when we launch.');


        // setIsSubmitting(true);

        // messageApi.open({
        //     key,
        //     type: 'loading',
        //     content: 'Submitting',
        // });


        // Make API request with axios
        const headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json'
        };

        axios.post(emailUrl, formData, { headers, withCredentials: false })
            .then(() => {
                // console.log('Success:', response.data);
                // alert('Thank you for your interest! We will notify you when we launch.');
                // Reset form after successful submission

                setIsSubmitted(true);
                setFormData({ name: '', email: '' });
            })
            .catch(error => {
                // console.error('Error submitting form:', error);
                messageApi.open({
                    key,
                    type: 'error',
                    content: 'Issue submitting',
                    duration: 2,
                });
            })
            .finally(() => {
                setIsSubmitting(false);
            });

    };

    return (
        <div className="flex flex-row items-center justify-center h-screen text-white 
        overflow-hidden bg-[#09090B] ">
            {contextHolder}

            {/* Content overlay */}
            <div className="z-10 flex flex-col items-center justify-center w-full max-w-xs px-8 absolute 
            bg-[#131214]/70 backdrop-blur-md p-6 rounded-2xl border-[2px] border-[#212121] 
            shadow-[0_8px_16px_rgba(255,255,255,0.03)]">
                <div className=' flex flex-col items-center justify-center w-full gap-8'>
                    {/* <Logo /> */}
                    <div className='flex flex-col gap-2'>
                        <img className='h-[23px] object-contain' src={ServlyIcon} alt='X' />
                        <img className='h-[20px]' src={ServlyWordmark} alt='Servly' />
                    </div>

                    {/* Heading */}
                    {
                        !isSubmitted && (
                            <div
                                className="flex justify-center gap-3 text-xl font-medium font-serif text-center mt-5 mb-5"
                                style={{ fontFamily: 'Helius' }}
                            >
                                Sign up for Internal Beta

                            </div>
                        )
                    }

                </div>


                {
                    isSubmitted
                        ? <CountdownTimer />
                        : (
                            <SignupForm
                                formData={formData}
                                onChange={handleFormChange}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                            />
                        )
                }

                {/* Social links */}
                {
                    isSubmitted && (
                        <Bounce>
                            <SocialLinks />
                        </Bounce>
                    )
                }

            </div>

            {/* 3D model container */}
            <JackInTheBox className='w-[100vw] h-[100vh]'>
                <ParticleAttractorSystem />
            </JackInTheBox>

        </div>
    );
};

export default ComingSoonPage;