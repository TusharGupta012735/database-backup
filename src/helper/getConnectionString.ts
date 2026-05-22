import { text } from "@clack/prompts"

export async function getConnectionString() : Promise<string>{
    const connectionString = await text({
        message : "Enter your connection string : ",
        validate(value){
          if(value!.length == 0) return "Value is required !"
        }
      })
      return connectionString as string;
}