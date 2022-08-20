import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Formik } from "formik";
import * as Yup from "yup";

const TokenSchema = Yup.object().shape({
  token: Yup.string().min(0, "Too Short!").required("Required"),
});

export const ReadwiseModal = ({
  isOpen,
  setReadwiseToken,
}: {
  isOpen: boolean;
  setReadwiseToken: (token: string) => void;
}) => {
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
                    Get Readwise token
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      For ReMarkable Web to talk to Readwise&apos;s API, you
                      need get your Readwise API token{" "}
                      <a
                        className="underline text-blue-600"
                        href="https://readwise.io/access_token"
                        target="_blank"
                        rel="noreferrer"
                      >
                        here
                      </a>{" "}
                      and then enter it below. This is saved in your
                      browser&apos;s local storage.
                    </p>
                  </div>

                  <div className="mt-4">
                    <Formik
                      initialValues={{ token: "" }}
                      validationSchema={TokenSchema}
                      onSubmit={(values) => {
                        setReadwiseToken(values.token);
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
                              htmlFor="token"
                            >
                              Token
                            </label>
                            <input
                              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none"
                              id="token"
                              type="text"
                              name="token"
                              onChange={handleChange}
                              onBlur={handleBlur}
                              value={values.token}
                              size={8}
                            />

                            <p className="text-red-500 text-xs italic">
                              {errors.token}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <button
                              type="submit"
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                            >
                              Submit
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
