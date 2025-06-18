import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface LaunchStage {
  message: string;
  description: string;
  icon: JSX.Element;
}

interface LaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: number;
  stages: LaunchStage[];
  progress: number;
  error: string | null;
  launchComplete: boolean;
  appUrl: string | null;
}

export default function LaunchModal({
  isOpen,
  onClose,
  currentStage,
  stages,
  progress,
  error,
  launchComplete,
  appUrl,
}: LaunchModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Launching New Instance
                </Dialog.Title>

                <div className="mt-4">
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-6">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  {/* Stages */}
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 ${
                          index === currentStage
                            ? 'text-blue-600 dark:text-blue-400'
                            : index < currentStage
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-400'
                        }`}
                      >
                        <div className="flex-shrink-0">{stage.icon}</div>
                        <div>
                          <p className="font-medium">{stage.message}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error state */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center">
                        <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-800 dark:text-red-200">
                          {error}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Success state */}
                  {launchComplete && appUrl && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-800 dark:text-green-200">
                          Instance launched successfully!
                        </span>
                      </div>
                      <a
                        href={appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open Instance →
                      </a>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 dark:bg-blue-900 px-4 py-2 text-sm font-medium text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={onClose}
                    >
                      {launchComplete ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 