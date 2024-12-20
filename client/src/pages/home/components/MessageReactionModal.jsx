import React from 'react';

const MessageReactionModal = ({ message, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-35 flex items-center justify-center z-50">
            <div className="bg-white w-96 p-4 rounded shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Reactions</h2>
                <ul className="space-y-2 w-full">
                    {message.MessageReactions.map((reaction, index) => (
                        <li key={index} className="flex w-full items-center justify-between">
                            <section className='flex gap-2'><div className="profile flex justify-center items-center w-6 h-6 bg-gray-300 rounded-2xl">{reaction?.user?.username?.charAt(0)?.toUpperCase()}</div>
                                <span className="text-lg">{reaction.reaction}</span></section>
                            <span className="text-sm text-gray-600">

                                {reaction?.user?.username}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="closebutton flex justify-center items-center">
                    <button
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageReactionModal;
