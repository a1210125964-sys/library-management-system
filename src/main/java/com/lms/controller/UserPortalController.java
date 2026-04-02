package com.lms.controller;

import com.lms.dto.ApiResponse;
import com.lms.model.User;
import com.lms.service.AuthService;
import com.lms.service.BorrowService;
import com.lms.service.NoticeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserPortalController {

    private final AuthService authService;
    private final BorrowService borrowService;
    private final NoticeService noticeService;

    public UserPortalController(AuthService authService,
                                BorrowService borrowService,
                                NoticeService noticeService) {
        this.authService = authService;
        this.borrowService = borrowService;
        this.noticeService = noticeService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@RequestHeader("X-Token") String token) {
        User user = authService.requireUser(token);

        Map<String, Object> data = new HashMap<>();
        data.put("activeBorrowCount", borrowService.countActiveByUser(user.getId()));
        data.put("overdueCount", borrowService.countOverdueByUser(user.getId()));
        data.put("publishedNoticeCount", noticeService.countPublished());

        return ApiResponse.success("查询成功", data);
    }
}
