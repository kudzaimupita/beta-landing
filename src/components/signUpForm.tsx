import React from 'react';

const SignupForm = ({ formData, onChange, onSubmit, isSubmitting }) => {
    return (
        <form onSubmit={onSubmit} className="w-full">
            <style>
                {`
                .name-input, emailinput, submitbtn {
                font-family: 'Helius' !important;
                }
                `}
            </style>
            <div className="mb-4">
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    className="nameinput w-full p-3 bg-[#131214]/80 border-[1px] border-[#212121] rounded-lg text-white placeholder-gray-400 
                    focus:outline-none focus:border-purple-400 text-sm"
                    value={formData.name}
                    onChange={onChange}
                    required
                    style={{ fontFamily: 'Helius' }}
                />
            </div>

            <div className="mb-10">
                <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    className="emailinput w-full p-3 bg-[#131214]/80 border-[1px] border-[#212121] rounded-lg text-white placeholder-gray-400 
                    focus:outline-none focus:border-purple-400 text-sm"
                    value={formData.email}
                    onChange={onChange}
                    required
                    style={{ fontFamily: 'Helius' }}
                />
            </div>

            <button
                type="submit"
                className="submitbtn w-full p-3 bg-white text-neutral-900 rounded-lg font-medium hover:bg-opacity-70 transition-colors"
                style={{ fontFamily: 'Helius Medium' }}
                disabled={isSubmitting}
            >
                {
                    isSubmitting ? '...' : 'Submit Email'
                }

            </button>
        </form>
    );
};

export default SignupForm;