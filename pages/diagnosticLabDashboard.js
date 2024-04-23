import Head from "next/head"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import { ConnectButton, Loading } from "web3uikit"
import Header from "../components/Header"
import DiagnosticLabWorkflow from "../components/DiagnosticLabWorkflow"
import DiagnosticLabProfile from "../components/DiagnosticLabProfile"
import NotRegistered from "../components/NotRegistered"
import { useState, useEffect } from "react"

export default function DiagnosticLabDashboard() {
    const {
        isWeb3Enabled,
        chainId: chainHexId,
        account: diagnosticLabAddress,
    } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const [diagnosticLabInfo, setDiagnosticLabInfo] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    useEffect(() => {
        const fetchDiagnosticLab = async () => {
            if (diagnosticLabAddress) {
                await initiateGetDiagnosticLabDetailsFunction()
            }
        }

        fetchDiagnosticLab().catch((e) => console.log("Error in useEffect", e))
    }, [diagnosticLabAddress])

    const initiateGetDiagnosticLabDetailsFunction = async () => {
        const getDiagnosticLabDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystemAddress,
            functionName: "getDiagnosticLabDetails",
            params: {
                _diagnosticLabAddress: diagnosticLabAddress,
            },
        }

        // initiating the getDiagnosticLabDetails function
        await runContractFunction({
            params: getDiagnosticLabDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getDiagnosticLabDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                setIsLoading(false)
                if (res[2] == false) {
                    console.log("DiagnosticLab is not registered")
                } else {
                    console.log("DiagnosticLab is registered")
                    setIsRegistered(true)

                    // setting up the diagnosticLabInfo hash
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
                            setDiagnosticLabInfo(data)
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
                <title>Myriad - DiagnosticLab Dashboard</title>
                <meta
                    name="description"
                    content="Myriad - DiagnosticLab Dashboard"
                />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <Header />
            <div className="container">
                <div className="py-4 px-3 font-bold text-4xl ml-12">
                    DiagnosticLab Dashboard
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
                            <DiagnosticLabProfile diagnosticLabInfo={diagnosticLabInfo} />
                        ) : (
                            <NotRegistered name="DiagnosticLab" />
                        )
                    ) : (
                        <div>
                            <DiagnosticLabWorkflow />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
