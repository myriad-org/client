import truncatStr from "../utils/truncateString"
import timestampToDate from "../utils/timestampToDate"
import { useState } from "react"

export default function DiagnosticLabProfile({
    diagnosticLabInfo
}) {
    return (
        <div>
            <div>
                <div className="md:w-fit md:mx-auto w-full mx-auto bg-sky-200 bg-opacity-80 mt-10 p-5 rounded-lg hover:bg-opacity-100">
                    <div className="card p-4 hover">
                        <div className="mb-1">
                            <span>
                                <span className="font-sans md:text-xl font-medium hover:underline">
                                    Name
                                </span>
                                :{" "}
                                <span className="font-serif md:text-xl font-normal">
                                    {diagnosticLabInfo?.name}
                                </span>
                            </span>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Lab Account Address
                            </span>
                            :{" "}
                            <a
                                className="badge ml-3 md:p-2 px-4"
                                title="view on etherscan"
                                target="_blank"
                                href={
                                    "https://goerli.etherscan.io/address/" +
                                    diagnosticLabInfo?.diagnosticLabAddress
                                }
                            >
                                {truncatStr(diagnosticLabInfo?.diagnosticLabAddress, 20)}
                            </a>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Diagnostic Lab Registration Id
                            </span>
                            :{" "}
                            <a className="badge badge-warning ml-3 md:p-2 px-4">
                                {diagnosticLabInfo?.registrationId}
                            </a>
                        </div>

                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                E-mail
                            </span>
                            :{" "}
                            <span className="badge badge-accent">{diagnosticLabInfo?.email}</span>
                        </div>
                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Phone Number
                            </span>
                            :{" "}
                            <span className="badge badge-warning">
                                {diagnosticLabInfo?.phoneNumber}
                            </span>
                        </div>
                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Registered on (system)
                            </span>
                            :{" "}
                            <span className="badge badge-accent">
                                {timestampToDate(diagnosticLabInfo?.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
