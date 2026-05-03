import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { deleteCafe, cafeKeys } from "@/lib/api/cafes";
import {
  approveSubmission,
  deleteSubmission,
  submissionKeys,
} from "@/lib/api/submissions";
import {
  approveImageSubmission,
  deleteImageSubmission,
  imageSubmissionKeys,
} from "@/lib/api/imageSubmissions";
import {
  approveEditSubmission,
  deleteEditSubmission,
  editSubmissionKeys,
} from "@/lib/api/editSubmissions";

function useAdminMutation(
  mutationFn: (id: string) => Promise<void>,
  successMessage: string,
  invalidateKeys: QueryKey[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      invalidateKeys.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAdminMutations() {
  const approve = useAdminMutation(approveSubmission, "제보가 승인되었습니다.", [
    submissionKeys.list(),
    cafeKeys.list(),
    cafeKeys.markers(),
  ]);

  const rejectSubmission = useAdminMutation(
    deleteSubmission,
    "제보가 거절되었습니다.",
    [submissionKeys.list()],
  );

  const removeCafe = useAdminMutation(deleteCafe, "카페가 삭제되었습니다.", [
    cafeKeys.list(),
    cafeKeys.markers(),
  ]);

  const approveImage = useAdminMutation(
    approveImageSubmission,
    "이미지 제보가 승인되었습니다.",
    [imageSubmissionKeys.list(), cafeKeys.list(), cafeKeys.all],
  );

  const rejectImage = useAdminMutation(
    deleteImageSubmission,
    "이미지 제보가 거절되었습니다.",
    [imageSubmissionKeys.list()],
  );

  const approveEdit = useAdminMutation(
    approveEditSubmission,
    "수정 제보가 승인되었습니다.",
    [editSubmissionKeys.list(), cafeKeys.all],
  );

  const rejectEdit = useAdminMutation(
    deleteEditSubmission,
    "수정 제보가 거절되었습니다.",
    [editSubmissionKeys.list()],
  );

  return {
    approve,
    rejectSubmission,
    removeCafe,
    approveImage,
    rejectImage,
    approveEdit,
    rejectEdit,
  };
}
