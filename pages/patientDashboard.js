import Head from "next/head"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ConnectButton, Loading } from "web3uikit"
import Header from "../components/Header"
import PatientWorkflow from "../components/PatientWorkflow"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import PatientProfile from "../components/PatientProfile"
import NotRegisteredPatient from "../components/NotRegisteredPatient"
import { useEffect, useState } from "react"

export default function PatientDashboard() {
    const {
        isWeb3Enabled,
        chainId: chainHexId,
        account: patientAddress,
    } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const [patientInfo, setPatientInfo] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    useEffect(() => {
        const fetchPatient = async () => {
            if (patientAddress) {
                await initiateGetPatientDetailsFunction()
            }
        }

        fetchPatient().catch((e) => console.log("Error in useEffect", e))
    }, [patientAddress])

    const initiateGetPatientDetailsFunction = async () => {
        const getPatientDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystemAddress,
            functionName: "getPatientDetails",
            params: {
                _patientAddress: patientAddress,
            },
        }

        // Actually calling the function. [This is where the transaction initiation actually begins].
        await runContractFunction({
            params: getPatientDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getPatientDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                setIsLoading(false)
                if (res[2] == false) {
                    console.log("Patient is not registered")
                } else {
                    console.log("Patient is registered")
                    setIsRegistered(true)

                    // setting up the patientInfo hash
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
                            setPatientInfo(data)
                        })
                        .catch((error) => {
                            console.error("Error fetching IFPS info:", error)
                        })
                }
            },
        })
    }

    return (
        <div className="mx-auto overflow-x-hidden h-screen">
            <Head>
                <title>Myriad - Patient Dashboard</title>
                <meta name="description" content="Myriad - Patient Dashboard" />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <Header />
            <div className="container mx-auto">
                <div className="py-4 px-3 font-bold text-4xl ml-12">
                    Patient Dashboard
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
                            <div>
                                <PatientProfile patientInfo={patientInfo} />
                            </div>
                        ) : (
                            <NotRegisteredPatient account={patientAddress} />
                        )
                    ) : (
                        <PatientWorkflow />
                    )}
                </div>
            </div>
        </div>
    )
}
