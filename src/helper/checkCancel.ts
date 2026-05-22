import { cancel, isCancel } from "@clack/prompts";

export async function cancelCheck(functionName : string | symbol){
    if(isCancel(functionName)){
        cancel("Operation cancelled.");
        process.exit(0);
    }
}