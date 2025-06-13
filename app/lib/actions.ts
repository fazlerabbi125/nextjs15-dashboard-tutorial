"use server";
// you cannot declare a server action in a client component. Only in server components or a file with the "use server" directive.

import { z } from "zod";
import postgres from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer.",
    }),
    amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0." }),
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status.",
    }),
    date: z.string(),
}); //To handle type validation

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export interface State {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
}

export async function createInvoice(prevState: State, formData: FormData) {
    try {
        const { customerId, amount, status } = CreateInvoice.parse({
            customerId: formData.get("customerId"),
            amount: formData.get("amount"),
            status: formData.get("status"),
        });
        const amountInCents = amount * 100; // To cents
        const date = new Date().toISOString().split("T")[0];
        await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    } catch (err) {
        if (err instanceof z.ZodError) {
            // const errors: Record<string, string> = {};
            // const zodErr = err.flatten().fieldErrors;
            // for (const key in zodErr) {
            //     if (!zodErr[key]) continue;
            //     errors[key] = zodErr[key][0];
            // }
            return { errors: err.flatten().fieldErrors, message: "Invalid input present" };
        } else {
            return <State>{ message: "Failed to Create Invoice." };
        }
    }
    /**
    Next.js has a client-side router cache that stores the route segments in the user's browser for a time. Along with prefetching, this cache ensures that users can quickly navigate between routes while reducing the number of requests made to the server.

    Since you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server. You can do this with the revalidatePath function from Next.js
     */
    revalidatePath("/dashboard/invoices");
    // redirect internally throws an error so it should be called outside of try/catch blocks.
    redirect("/dashboard/invoices");
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
    try {
        const { customerId, amount, status } = UpdateInvoice.parse({
            customerId: formData.get("customerId"),
            amount: formData.get("amount"),
            status: formData.get("status"),
        });

        const amountInCents = amount * 100;

        await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
    } catch (err) {
        if (err instanceof z.ZodError) {
            const error: Record<string, string> = {};
            const zodErr = err.formErrors.fieldErrors;
            for (const key in zodErr) {
                if (!zodErr[key]) continue;
                error[key] = zodErr[key][0];
            }
            console.error("Validation error:", { error });
        } else {
            console.error(err);
        }
    }
    //https://nextjs.org/docs/app/getting-started/caching-and-revalidating
    //Calling revalidatePath to clear the client cache and make a new server request.
    revalidatePath("/dashboard/invoices");
    redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
    // throw new Error("Failed to Delete Invoice");
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath("/dashboard/invoices");
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }
}
