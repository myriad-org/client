import truncatStr from "../utils/truncateString"
import timestampToDate from "../utils/timestampToDate"
import { useState } from "react"

export default function HospitalProfile({ hospitalInfo }) {
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
                                    {hospitalInfo?.name}
                                </span>
                            </span>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Hospital Account Address
                            </span>
                            :{" "}
                            <a
                                className="badge ml-3 md:p-2 px-4"
                                title="view on etherscan"
                                target="_blank"
                                href={
                                    "https://goerli.etherscan.io/address/" +
                                    hospitalInfo?.hospitalAddress
                                }
                            >
                                {truncatStr(hospitalInfo?.hospitalAddress, 20)}
                            </a>
                        </div>
                        <div className="mb-1">
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Hospital Registration Id
                            </span>
                            :{" "}
                            <a className="badge badge-warning ml-3 md:p-2 px-4">
                                {hospitalInfo?.registrationId}
                            </a>
                        </div>

                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                E-mail
                            </span>
                            :{" "}
                            <span className="badge badge-accent">
                                {hospitalInfo?.email}
                            </span>
                        </div>
                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Phone Number
                            </span>
                            :{" "}
                            <span className="badge badge-warning">
                                {hospitalInfo?.phoneNumber}
                            </span>
                        </div>
                        <div>
                            <span className="font-sans md:text-xl font-medium hover:underline">
                                Registered on (system)
                            </span>
                            :{" "}
                            <span className="badge badge-accent">
                                {timestampToDate(hospitalInfo?.timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
