import Head from "next/head"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import { ConnectButton, Loading } from "web3uikit"
import Header from "../components/Header"
import HospitalWorkflow from "../components/HospitalWorkflow"
import HospitalProfile from "../components/HospitalProfile"
import NotRegistered from "../components/NotRegistered"
import { useState, useEffect } from "react"

export default function HospitalDashboard() {
    const {
        isWeb3Enabled,
        chainId: chainHexId,
        account: hospitalAddress,
    } = useMoralis()
    const { runContractFunction } = useWeb3Contract()

    const [hospitalInfo, setHospitalInfo] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isRegistered, setIsRegistered] = useState(false)

    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const patientMedicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    useEffect(() => {
        const fetchHospital = async () => {
            if (hospitalAddress) {
                await initiateGetHospitalDetailsFunction()
            }
        }

        fetchHospital().catch((e) => console.log("Error in useEffect", e))
    }, [hospitalAddress])

    const initiateGetHospitalDetailsFunction = async () => {
        const getHospitalDetailsOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: patientMedicalRecordSystemAddress,
            functionName: "getHospitalDetails",
            params: {
                _hospitalAddress: hospitalAddress,
            },
        }

        // initiating the getHospitalDetails function
        await runContractFunction({
            params: getHospitalDetailsOptions,
            onError: (error) => {
                console.log(
                    "Error while calling getHospitalDetails function",
                    error
                )
            },
            onSuccess: (res) => {
                setIsLoading(false)
                if (res[2] == false) {
                    console.log("Hospital is not registered")
                } else {
                    console.log("Hospital is registered")
                    setIsRegistered(true)

                    // setting up the hospitalInfo hash
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
                            setHospitalInfo(data)
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
                <title>Myriad - Hospital Dashboard</title>
                <meta
                    name="description"
                    content="Myriad - Hospital Dashboard"
                />
                <link rel="icon" href="/logo.svg" />
            </Head>
            <Header />
            <div className="container">
                <div className="py-4 px-3 font-bold text-4xl ml-12">
                    Hospital Dashboard
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
                            <HospitalProfile hospitalInfo={hospitalInfo} />
                        ) : (
                            <NotRegistered name="Hospital" />
                        )
                    ) : (
                        <div>
                            <HospitalWorkflow />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
