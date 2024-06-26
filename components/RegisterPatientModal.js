import { useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { Modal, Input, Select, useNotification } from "web3uikit"
import networkMapping from "../constants/networkMapping.json"
import PatientMedicalRecordSystemAbi from "../constants/PatientMedicalRecordSystem.json"
import dateInUnix from "../utils/dateInUnix"
import NodeRSA from "node-rsa"

export default function RegisterPatientModal({ isVisible, onClose, account }) {
    const dispatch = useNotification()
    const { runContractFunction } = useWeb3Contract()

    const [name, setName] = useState("")
    const [patientAddress, setPatientAddress] = useState(account)
    const [dob, setDob] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [bloodGroup, setBloodGroup] = useState(0)
    const [cancelDisabled, setCancelDisabled] = useState(false)
    const [okDisabled, setOkDisabled] = useState(false)
    const [showKeys, setShowKeys] = useState(false)
    const [publicKey, setPublicKey] = useState("")
    const [privateKey, setPrivateKey] = useState("")

    const { chainId: chainHexId } = useMoralis()
    const chainId = chainHexId ? parseInt(chainHexId).toString() : "31337"
    const medicalRecordSystemAddress =
        networkMapping[chainId]?.PatientMedicalRecordSystem[0]

    const handleRegisterPatientSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            title: "Transaction Successful",
            message:
                "You are now successfully registered to this decentralized medical record database system.",
            position: "bottomL",
        })
        onClose && onClose() //closing the modal on success
        setCancelDisabled(false)
        setOkDisabled(false)
        setShowKeys(false)
    }
    const generateKeys = async () => {
        const key = new NodeRSA({ bits: 4096 })
        const publicKey = key.exportKey("pkcs8-public-pem")
        const privateKey = key.exportKey("pkcs8-private-pem")
        return { publicKey, privateKey }
    }

    const uploadInfoToIpfs = async (info) => {
        const pinataPinUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        const folder = `${info.patientAddress}_json`
        const infoBlob = new Blob([JSON.stringify(info, null, 2)], {
            type: "application/json",
        })
        const files = [
            new File([infoBlob], "info.json", { type: "application/json" }),
        ]

        const data = new FormData()

        Array.from(files).forEach((file) => {
            data.append("file", file, `${folder}/${file.name}`)
        })
        const pinataMetadata = JSON.stringify({
            name: `${folder}`,
        })
        data.append("pinataMetadata", pinataMetadata)
        const req = {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
            },
            body: data,
        }
        
        try {
            const res = await fetch(pinataPinUrl, req)
            console.log(req, res)
            const resData = await res.json()
            console.log(resData)
            return resData.IpfsHash
        } catch (error) {
            console.log(error)
        }
    }

    const initiateRegisterPatientTransaction = async () => {
        setCancelDisabled(true)
        setOkDisabled(true)
        setShowKeys(true)
        const keys = await generateKeys()
        setPublicKey(keys.publicKey)
        setPrivateKey(keys.privateKey)

        //NOTIFICATION FOR GEENRATING PUBLIC AND PRIVATE KEYS
        dispatch({
            type: "success",
            title: "Public and Private Keys Generated",
            message:
                "Public and Private Key for encrypting your medical files generated successfully",
            position: "bottomL",
            isClosing: !okDisabled && !cancelDisabled,
        })

        const patientMetadata = {
            patientAddress: patientAddress,
            name: name,
            dob: dob,
            phoneNumber: phoneNumber,
            bloodGroup: bloodGroup,
            publicKey: keys.publicKey,
            timestamp: Date.now(),
            vaccinationHash: new Array(),
            acuteHash: new Array(),
            chronicHash: new Array(),
            accidentHash: new Array(),
        }
        
        // uploading the patient metadata to IPFS
        const ipfsInfoHash = await uploadInfoToIpfs(patientMetadata)

        // setting up the options for the registerPatient function
        const registerPatientOptions = {
            abi: PatientMedicalRecordSystemAbi,
            contractAddress: medicalRecordSystemAddress,
            functionName: "registerPatient",
            params: {
                _patientAddress: patientAddress,
                _patientInfo: ipfsInfoHash,
                _isUpdate: "false",
            },
        }

        // intiating the registerPatient function
        await runContractFunction({
            params: registerPatientOptions,
            onError: (error) => {
                console.log(
                    "Error while calling registerPatient function",
                    error
                )
            },
            onSuccess: handleRegisterPatientSuccess,
        })
    }

    const downloadPrivateKey = async () => {
        const element = document.createElement("a")
        const file = await new Blob(
            [
                privateKey ||
                    "Failed to Generate Private Key... Please cancel the Patient Registration...",
            ],
            {
                type: "text/plain",
            }
        )
        element.href = URL.createObjectURL(file)
        element.download = "privateKey.txt"
        document.body.appendChild(element)
        element.click()
    }
    const downloadPublicKey = async () => {
        const element = document.createElement("a")
        const file = await new Blob(
            [
                publicKey ||
                    "Failed to Generate Public Key... Please cancel the Patient Registration...",
            ],
            {
                type: "text/plain",
            }
        )
        element.href = URL.createObjectURL(file)
        element.download = "publicKey.txt"
        document.body.appendChild(element)
        element.click()
    }

    return (
        <div>
            <Modal
                isVisible={isVisible}
                onCancel={onClose}
                onCloseButtonPressed={onClose}
                onOk={initiateRegisterPatientTransaction}
                okButtonColor="blue"
                isCancelDisabled={cancelDisabled}
                isOkDisabled={okDisabled}
            >
                <div className="mb-5">
                    <Input
                        label="Enter Name of Patient"
                        name="Name of Patient"
                        type="text"
                        onChange={(event) => {
                            setName(event.target.value)
                        }}
                        validation={{
                            required: true,
                            minLength: 3,
                            maxLength: 20,
                        }}
                    />
                </div>
                <div className="mb-5">
                    <Input
                        label="Enter Patient's account"
                        name="Patient Account Address"
                        type="text"
                        onChange={(event) => {
                            setPatientAddress(event.target.value)
                        }}
                        value={account}
                        validation={{
                            required: true,
                            minLength: 42,
                            maxLength: 42,
                        }}
                    />
                </div>
                {/* Date Picker Starts Here */}
                <div className="mb-5">
                    <Input
                        label="Enter Date of Birth"
                        name="Date of Birth"
                        type="date"
                        onChange={(event) => {
                            setDob(dateInUnix(event.target.value))
                        }}
                        validation={{ required: true }}
                    />
                </div>

                <div className="mb-5">
                    <Select
                        label="Choose Blood Group"
                        onChangeTraditional={(event) => {
                            setBloodGroup(event.target.value)
                        }}
                        options={[
                            {
                                id: "o-negative",
                                label: "O negative",
                            },
                            {
                                id: "o-positive",
                                label: "O positive",
                            },
                            {
                                id: "a-negative",
                                label: "A negative",
                            },
                            {
                                id: "a-positive",
                                label: "A positive",
                            },
                            {
                                id: "b-negative",
                                label: "B negative",
                            },
                            {
                                id: "b-positive",
                                label: "B positive",
                            },
                            {
                                id: "ab-negative",
                                label: "AB negative",
                            },
                            {
                                id: "ab-positive",
                                label: "AB positive",
                            },
                        ]}
                        traditionalHTML5
                        validation={{
                            required: true,
                        }}
                    />
                </div>
                {/* <div className="mb-5">
                    <Input
                        label="Enter Phone Number"
                        name="Phone Number"
                        type="text"
                        onChange={(event) => {
                            setPhoneNumber(event.target.value)
                        }}
                        validation={{ required: true }}
                    />
                </div> */}
                {showKeys ? (
                    <div>
                        <div className="alert alert-success shadow-lg mb-4">
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="stroke-current flex-shrink-0 h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>
                                    Save Your{" "}
                                    <div
                                        className="tooltip"
                                        data-tip="Do not Edit this File after Download"
                                    >
                                        <span
                                            className="btn btn-sm"
                                            onClick={downloadPublicKey}
                                        >
                                            Public Key
                                        </span>
                                    </div>{" "}
                                    and{" "}
                                    <div
                                        className="tooltip"
                                        data-tip="Do not Edit this File after Download"
                                    >
                                        <span
                                            className="btn btn-sm"
                                            onClick={downloadPrivateKey}
                                        >
                                            Private Key
                                        </span>
                                    </div>
                                </span>{" "}
                                &rarr;{" "}
                                <span>
                                    {" "}
                                    Keep your{" "}
                                    <span className="italic font-semibold">
                                        Private Key
                                    </span>{" "}
                                    safe and secure.
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}
            </Modal>
        </div>
    )
}
