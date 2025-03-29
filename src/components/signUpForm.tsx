import React from 'react';
import { PropagateLoader } from 'react-spinners'

const SignupForm = ({ formData, onChange, onSubmit, isSubmitting }) => {
    return (
        <form onSubmit={onSubmit} className="w-full">
            <style>
                {`
                .name-input, .emailinput {
                font-family: 'Inter', serif !important;
                }

                .submitbtn {
                font-family: 'Inter', serif !important;
                }
                `}
            </style>
            <div className="mb-3">
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    className="submitbtn w-full p-3 bg-[#131214]/80 border-[1px] border-[#272727] rounded-lg text-white placeholder-gray-400 
                    focus:outline-none focus:border-purple-400 text-sm"
                    value={formData.name}
                    onChange={onChange}
                    required
                    style={{ fontFamily: 'Helius Medium' }}
                    disabled={isSubmitting}
                />
            </div>

            <div className="mb-10">
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    className="submitbtn w-full p-3 bg-[#131214]/80 border-[1px] border-[#272727] rounded-lg text-white placeholder-gray-400 
                    focus:outline-none focus:border-purple-400 text-sm"
                    value={formData.email}
                    onChange={onChange}
                    required
                    style={{ fontFamily: 'Helius Medium' }}
                    disabled={isSubmitting}
                />
            </div>

            {
                isSubmitting ? (
                    <button
                        type="submit"
                        className="w-full p-2 text-neutral-900 rounded-lg font-medium hover:bg-opacity-80 
                        transition-colors flex justify-center items-center"
                        style={{ fontFamily: 'Inter' }}
                        disabled={isSubmitting}
                    >
                        <PropagateLoader color='#D6CBFF' size={12} />
                    </button>
                ) : (
                    <button
                        type="submit"
                        className="w-full p-2 bg-white text-neutral-900 rounded-lg font-semibold hover:bg-opacity-50 transition-colors"
                        style={{ fontFamily: 'Inter' }}
                        disabled={isSubmitting}
                    >
                        Save
                    </button>
                )
            }
        </form>
    );
};

export default SignupForm;