


"use client"
import { Trash2Icon, UploadIcon, LinkIcon, FileTextIcon } from 'lucide-react';
import { useAction, useMutation, useQueries, useQuery } from "convex/react"
import { api } from "convex/_generated/api";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { extractTextFromPdf } from "@/lib/pdfUtils";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input2';
import { Card } from '@/components/ui/card';
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET!;



export default function AdminPanel() {
    const generateUploadUrl = useMutation(api.document.generateUploadUrl);
    const [expiresAt, setExpiresAt] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isloading, setIsLoading] = useState(false);
    const storeFile = useAction(api.document.storeFile);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'documents'>('upload');
    const documents = useQuery(api.document.listDocuments);
    const [category, setCategory] = useState<"Exam" | "Admission">("Admission");
    const deleteDocuemt = useAction(api.document.deleteOldPdf);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [mounted, setMounted] = useState(false);


    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // or loading skeleton
    }
    function handleFileChange(file: File | null) {
        setSelectedFile(file);
    }

    // async function handleSubmit(e: React.FormEvent) {

    function handleFileUpload() {

        if (!selectedFile) {
            setMessage({ type: 'error', text: 'Please select a PDF file' });
            return;
        }

        setIsLoading(true);
        setMessage(null);
        try {
            console.log("Uploading file", selectedFile.name);
            handleFileExtraction(selectedFile);
        }
        catch (error) {
            console.log("Failed to file extact ");
            throw new Error("Failed to extract file ");
        }
        finally {
            setIsLoading(false);


        }
    }



    async function handleFileExtraction(file: File) {
        try {
            const extractionResult = await extractTextFromPdf(file);
            console.log(extractionResult.text)
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": selectedFile!.type },
                body: selectedFile,
            });
            const { storageId } = await result.json();
            const expiresAtTimestamp =
                expiresAt ? new Date(expiresAt).getTime() : undefined;
            console.log("calling store file");
            const { docsId, entryId } = await storeFile({
                adminSecret: ADMIN_SECRET,
                storageId,
                filename: file.name,
                text: extractionResult.text,
                category,
                validTill: expiresAtTimestamp,
            });
            console.log("resonse of storeFile", docsId, entryId);

        }
        catch (error) {
            console.log("Failed to file extact ");
            throw new Error("Failed to extract file ");
        } finally {
            setIsLoading(false);
            setSelectedFile(null);
            setExpiresAt("");
        }
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };




    return (
        // <div>
        //     Admin Dashboard
        //     <form
        //         onSubmit={handleSubmit}
        //         className="w-full max-w-sm space-y-4 rounded-lg border p-4 bg-white shadow"
        //     >
        //         <div>
        //             <label className="block text-sm font-medium text-slate-700 mb-1">
        //                 Upload file
        //             </label>

        //             <input
        //                 ref={fileInputRef}
        //                 type="file"
        //                 accept="*/*"
        //                 onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        //                 className="block w-full text-sm text-slate-600
        //     file:mr-4 file:rounded-md file:border-0
        //     file:bg-blue-600 file:px-4 file:py-2
        //     file:text-sm file:font-medium file:text-white
        //     hover:file:bg-blue-700"
        //             />
        //         </div>

        //         {selectedFile && (
        //             <p className="text-sm text-slate-500">
        //                 Selected: <span className="font-medium">{selectedFile.name}</span>
        //             </p>
        //         )}

        //         <Button
        //             type="submit"
        //             disabled={!selectedFile || isloading}
        //             className="w-full bg-blue-600 hover:bg-blue-700"
        //         >
        //             {isloading ? "Uploading..." : "Upload"}
        //         </Button>
        //     </form>

        // </div>

        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-6xl mx-auto px-6">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">Admin Dashboard</h1>
                        <p className="mt-1 text-sm text-slate-500">Manage documents and uploads for the knowledge base</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`px-4 py-2 rounded-full text-sm ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                            Upload
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-4 py-2 rounded-full text-sm ${activeTab === 'documents' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                            Documents
                        </button>
                    </div>
                </header>
                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}
                {activeTab === 'upload' && (
                    <Card className="p-6 mb-6 bg-white/80">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <UploadIcon className="h-5 w-5 text-blue-600" />
                                Upload PDF
                            </h2>
                            <div className="text-sm text-slate-500">Supported: PDF files (text will be extracted)</div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium mb-2">PDF File</label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="w-full"
                                />
                                {selectedFile && <p className="mt-2 text-sm text-slate-600">Selected: <span className="font-medium">{selectedFile.name}</span></p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as "Admission" | "Exam")}
                                    className="w-full px-3 py-2 border rounded-md bg-white"
                                >
                                    <option value="Admission">Admission</option>
                                    <option value="Exam">Exam</option>
                                </select>


                                <label className="block text-sm font-medium mt-4 mb-2">Expires At (optional)</label>
                                <Input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                />


                            </div>
                        </div>

                        <div className="mt-6">
                            <Button onClick={handleFileUpload} disabled={!selectedFile || isloading} className="bg-blue-600">
                                {isloading ? 'Uploading...' : 'Upload PDF'}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* {activeTab === 'documents' && (
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">All Documents <span className="text-sm text-slate-500">({documents.length})</span></h2>
                        </div>

                        {documents.length === 0 ? (
                            <p className="text-gray-500">No documents yet. Upload a PDF, embed a URL, or create a manual entry.</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="flex flex-col justify-between p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileTextIcon className="h-5 w-5 text-slate-600" />
                                                <h3 className="font-semibold text-slate-800 truncate">{doc.filename}</h3>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {doc.validTill && `Expires: ${formatDate(doc.validTill)}`}
                                                {doc.category && ` • Category: ${doc.category}`}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <a href={doc.downloadUrl} className="text-sm text-blue-600 hover:underline">Download</a>
                                            <span className={`text-xs px-2 py-1 rounded ${doc.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{doc.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )} */}
                {activeTab === 'documents' && (
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            All Documents <span className="text-sm text-slate-500">
                                ({documents?.length ?? 0})
                            </span>
                        </h2>

                        {!documents ? (
                            <p className="text-gray-500">Loading documents...</p>
                        ) : documents.length === 0 ? (
                            <p className="text-gray-500">No documents uploaded yet.</p>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {documents.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="p-4 border rounded-lg bg-white shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileTextIcon className="h-5 w-5 text-slate-600" />
                                            <h3 className="font-semibold truncate">{doc.filename}</h3>
                                        </div>

                                        <p className="text-sm text-slate-500">
                                            {doc.category && `Category: ${doc.category}`}
                                        </p>

                                        {doc.validTill && (
                                            <p className="text-sm text-slate-500">
                                                Expires: {formatDate(doc.validTill)}
                                            </p>
                                        )}

                                        <div className="mt-4 flex justify-between items-center">
                                            <a
                                                href={doc.downloadUrl!}
                                                target="_blank"
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                Download
                                            </a>

                                            <span
                                                className={`text-xs px-2 py-1 rounded ${doc.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {doc.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            <Button className='bg-red-500' onClick={async () => await deleteDocuemt({ docsId: doc._id })} >Delete from everywhere.</Button>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

            </div>
        </div>
    );
}
