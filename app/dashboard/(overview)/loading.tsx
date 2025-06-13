import DashboardSkeleton from "@/app/ui/skeletons";

export default function Loading() {
    return <DashboardSkeleton />;
    // All inner pages will show this skeleton while loading unless they have their own loading.tsx or route groups are used
}
