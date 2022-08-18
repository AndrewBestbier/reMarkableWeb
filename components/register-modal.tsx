import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Formik } from "formik";

import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";

import axios from "axios";

export const registerDevice = async (code: string) => {
  return axios.post<{ deviceToken: string }>("/api/register", {
    code,
  });
};

const RegisterSchema = Yup.object().shape({
  code: Yup.string().min(8, "Too Short!").required("Required"),
});

export const RegisterDeviceModal = ({
  isOpen,
  setDeviceToken,
}: {
  isOpen: boolean;
  setDeviceToken: (deviceToken: string) => void;
}) => {
  const { mutate, isLoading } = useMutation(registerDevice, {
    onSuccess: (response) => {
      setDeviceToken(response.data.deviceToken);
    },
  });

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => null}>
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 font-remarkable"
                  >
                    Register a new device
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      For ReMarkable Web to talk to ReMarkable&apos;s API, a new
                      device has to be registered through an 8 letter code.
                      Please generate a code{" "}
                      <a
                        className="underline text-blue-600"
                        href="https://my.remarkable.com/device/desktop/connect"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </a>{" "}
                      and then enter it below.
                    </p>
                  </div>

                  <div className="mt-4">
                    <Formik
                      initialValues={{ code: "" }}
                      validationSchema={RegisterSchema}
                      onSubmit={(values) => {
                        mutate(values.code);
                      }}
                    >
                      {({
                        values,
                        errors,
                        handleChange,
                        handleBlur,
                        handleSubmit,
                      }) => (
                        <form onSubmit={handleSubmit}>
                          <div className="mb-6">
                            <label
                              className="block text-gray-700 text-sm font-bold mb-2 font-remarkable"
                              htmlFor="code"
                            >
                              Code
                            </label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
                              id="code"
                              type="text"
                              name="code"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              value={values.code}
                              size={8}
                            />

                            <p className="text-red-500 text-xs italic">
                              {errors.code}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <a href="/manual" className="text-blue-500">
                              If you wish to upload a PDF manually, click here
                            </a>
                            <button
                              type="submit"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                              {isLoading ? "Submitting" : "Submit"}
                            </button>
                          </div>
                        </form>
                      )}
                    </Formik>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
