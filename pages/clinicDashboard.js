import Head from "next/head"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import { ConnectButton, Loading } from "web3uikit"
import Header from "../components/Header"
import ClinicWorkflow from "../components/ClinicWorkflow"
import ClinicProfile from "../components/ClinicProfile"
import NotRegistered from "../components/NotRegistered"
import { useState, useEffect } from "react"

export default function ClinicDashboard() {
    const {
        isWeb3Enabled,
        chainId: chainHexId,
        account: clinicAddress,
    } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const [clinicInfo, setClinicInfo] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    useEffect(() => {
        const fetchClinic = async () => {
            if (clinicAddress) {
                await initiateGetClinicDetailsFunction()
            }
        }

        fetchClinic().catch((e) => console.log("Error in useEffect", e))
    }, [clinicAddress])

    const initiateGetClinicDetailsFunction = async () => {
        const getClinicDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystemAddress,
            functionName: "getClinicDetails",
            params: {
                _clinicAddress: clinicAddress,
            },
        }

        // initiating the getClinicDetails function
        await runContractFunction({
            params: getClinicDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getClinicDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                setIsLoading(false)
                if (res[2] == false) {
                    console.log("Clinic is not registered")
                } else {
                    console.log("Clinic is registered")
                    setIsRegistered(true)

                    // setting up the clinicInfo hash
                    const ipfsInfoHash = res[1]
                    fetch(
                        process.env.pinata_gateway_url +
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
                            setClinicInfo(data)
                        })
                        .catch((error) => {
                            console.error("Error fetching IFPS info:", error)
                        })
                }
            },
        })
    }

    return (
        <div className="container mx-auto  overflow-x-hidden h-screen">
            <Head>
                <title>Myriad - Clinic Dashboard</title>
                <meta
                    name="description"
                    content="Myriad - Clinic Dashboard"
                />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <Header />
            <div className="container">
                <div className="py-4 px-3 font-bold text-4xl ml-12">
                    Clinic Dashboard
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
                            <ClinicProfile clinicInfo={clinicInfo} />
                        ) : (
                            <NotRegistered name="Clinic" />
                        )
                    ) : (
                        <div>
                            <ClinicWorkflow />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
