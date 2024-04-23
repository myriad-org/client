import Head from "next/head"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ConnectButton, Loading } from "web3uikit"
import Header from "../components/Header"
import DoctorWorkflow from "../components/DoctorWorkflow"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import DoctorProfile from "../components/DoctorProfile"
import NotRegistered from "../components/NotRegistered"
import { useState, useEffect } from "react"

export default function DoctorDashboard() {
    const {
        isWeb3Enabled,
        chainId: chainHexId,
        account: doctorAddress,
    } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const [doctorInfo, setDoctorInfo] = useState({})
    const [isLoading, setIsLoading] = useState(true)

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    const [isRegistered, setIsRegistered] = useState(false)

    useEffect(() => {
        const fetchDoctor = async () => {
            if (doctorAddress) {
                await initiateGetDoctorDetailsFunction()
            }
        }

        fetchDoctor().catch((e) => console.log("Error in useEffect", e))
    }, [doctorAddress])

    const initiateGetDoctorDetailsFunction = async () => {
        const getDoctorDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystemAddress,
            functionName: "getDoctorDetails",
            params: {
                _doctorAddress: doctorAddress,
            },
        }

        // Actually calling the function. [This is where the transaction initiation actually begins].
        await runContractFunction({
            params: getDoctorDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getDoctorDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                setIsLoading(false)
                if (res[2] == false) {
                    console.log("Doctor is not registered")
                } else {
                    console.log("Doctor is registered")
                    setIsRegistered(true)

                    // setting up the doctorInfo hash
                    const ipfsInfoHash = res[1]
                    fetch(
                        process.env.NEXT_PUBLIC_PINATA_GATEWAY_DOMAIN +
                            ipfsInfoHash +
                            "/info.json"
                    ) // generic filename
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error("Couldn't fetch IFPS info")
                            }
                            return response.json()
                        })
                        .then((data) => {
                            console.log(data)
                            setDoctorInfo(data)
                        })
                        .catch((error) => {
                            console.error("Error fetching IFPS info:", error)
                        })
                }
            },
        })
    }

    return (
        <div className="container mx-auto overflow-x-hidden h-screen">
            <Head>
                <title>Myriad - Doctor Dashboard</title>
                <meta name="description" content="Myriad - Doctor Dashboard" />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <Header />
            <div className="container">
                <div className="py-4 px-3 font-bold text-4xl ml-12">
                    Doctor Dashboard
                    {isWeb3Enabled ? (
                        <div className="badge badge-primary ml-4">
                            Web3 is Enabled
                        </div>
                    ) : (
                        <div className="badge badge-warning ml-4">
                            Web3 Not Enabled
                        </div>
                    )}
                </div>
                <div className="mx-auto ml-12">
                    <ConnectButton moralisAuth={false} />
                </div>

                <div className="ml-10 w-4/6">
                    {isWeb3Enabled ? (
                        isLoading ? (
                            <div
                                style={{
                                    backgroundColor: "#ECECFE",
                                    borderRadius: "6px",
                                    padding: "15px",
                                }}
                                className="ml-10 mt-5"
                            >
                                <Loading
                                    direction="right"
                                    fontSize={14}
                                    size={16}
                                    spinnerColor="rgba(91, 96, 222, 0.8)"
                                    spinnerType="wave"
                                    text="Loading Profile..."
                                />
                            </div>
                        ) : isRegistered ? (
                            <DoctorProfile doctorInfo={doctorInfo} />
                        ) : (
                            <NotRegistered name="Doctor" />
                        )
                    ) : (
                        <div>
                            <DoctorWorkflow />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* 1. registered doctors can view their details. 
                        
2. Registered doctors can add diagnostic tests and diagnosis details in a particular patient's record. For this Add a Button which opens a modal form.
*/
